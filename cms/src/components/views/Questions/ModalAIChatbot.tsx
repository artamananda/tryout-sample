import { useState, useRef, useEffect } from "react";
import {
  Modal,
  Input,
  Button,
  Space,
  Typography,
  Card,
  Divider,
  message,
  Spin,
  Checkbox,
  Tag,
  Avatar,
  Tooltip,
} from "antd";
import {
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { apiChat, apiSaveToBankSoal } from "../../../api/ai";
import { apiCreateQuestion } from "../../../api/question";
import {
  AIChatMessage,
  GeneratedQuestion,
  CreateBankSoalRequest,
} from "../../../types/ai.type";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface ModalAIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  tryoutId: string;
  questionType: string;
  onQuestionsCreated: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  questions?: GeneratedQuestion[];
  timestamp: Date;
}

const ModalAIChatbot = ({
  isOpen,
  onClose,
  tryoutId,
  questionType,
  onQuestionsCreated,
}: ModalAIChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [saveToBankSoal, setSaveToBankSoal] = useState(true);
  const [pendingQuestions, setPendingQuestions] = useState<GeneratedQuestion[]>(
    []
  );
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([
        {
          role: "assistant",
          content: `Halo! Saya AI Assistant yang siap membantu Anda membuat soal. 🎓\n\nAnda bisa:\n1. **Ngobrol** - Diskusikan topik atau materi yang ingin dijadikan soal\n2. **Generate Soal** - Ketik "buat soal tentang [topik]" untuk langsung generate\n\nKetik apa saja untuk mulai!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const getQuestionTypeName = (code: string) => {
    const typeNames: Record<string, string> = {
      kpu: "Penalaran Umum",
      ppu: "Pengetahuan dan Pemahaman Umum",
      pbm: "Pemahaman Bacaan dan Menulis",
      pku: "Pengetahuan Kuantitatif",
      ind: "Literasi Bahasa Indonesia",
      ing: "Literasi Bahasa Inggris",
      mtk: "Penalaran Matematika",
    };
    return typeNames[code] || code.toUpperCase();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      // Check if user wants to generate questions
      const isGenerateRequest =
        inputValue.toLowerCase().includes("buat soal") ||
        inputValue.toLowerCase().includes("generate") ||
        inputValue.toLowerCase().includes("buatkan") ||
        (inputValue.toLowerCase().includes("soal") &&
          inputValue.toLowerCase().includes("tentang"));

      const chatMessages: AIChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      chatMessages.push({ role: "user", content: inputValue });

      const response = await apiChat({
        messages: chatMessages,
        question_type: questionType,
        mode: isGenerateRequest ? "generate" : "chat",
      });

      if (response) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.message,
          questions: response.questions,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (response.questions && response.questions.length > 0) {
          setPendingQuestions(response.questions);
          // Extract topic from user message
          const topicMatch = inputValue.match(/tentang\s+(.+)/i);
          if (topicMatch) {
            setTopic(topicMatch[1].trim());
          }
          // Default select all questions
          setSelectedQuestions(new Set(response.questions.map((_, i) => i)));
        }
      }
    } catch (error) {
      message.error("Gagal berkomunikasi dengan AI");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGenerate = async (count: number, diff: string) => {
    if (!topic.trim()) {
      message.warning("Masukkan topik terlebih dahulu");
      return;
    }

    const prompt = `Buat ${count} soal ${diff} tentang ${topic} untuk ${getQuestionTypeName(
      questionType
    )}`;
    setInputValue(prompt);
    setDifficulty(diff);
  };

  const toggleQuestionSelection = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSaveQuestions = async () => {
    if (selectedQuestions.size === 0) {
      message.warning("Pilih minimal 1 soal untuk disimpan");
      return;
    }

    setSaving(true);
    try {
      const selectedQs = pendingQuestions.filter((_, i) =>
        selectedQuestions.has(i)
      );
      let savedToBankCount = 0;
      let savedToTryoutCount = 0;

      // Save to Bank Soal if checked
      if (saveToBankSoal) {
        const bankSoalData: CreateBankSoalRequest[] = selectedQs.map((q) => ({
          type: questionType,
          text: q.text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: difficulty,
          topic: topic,
          is_ai_generated: true,
          is_options: true,
        }));

        const bankResult = await apiSaveToBankSoal({ questions: bankSoalData });
        if (bankResult) {
          savedToBankCount = bankResult.length;
        }
      }

      // Save to Tryout
      for (let i = 0; i < selectedQs.length; i++) {
        const q = selectedQs[i];
        const result = await apiCreateQuestion({
          tryout_id: tryoutId,
          local_id: i + 1,
          type: questionType,
          text: q.text,
          options: q.options,
          correct_answer: q.correct_answer,
          is_options: true,
        });
        if (result) {
          savedToTryoutCount++;
        }
      }

      let successMessage = `${savedToTryoutCount} soal berhasil ditambahkan ke tryout`;
      if (saveToBankSoal && savedToBankCount > 0) {
        successMessage += ` dan ${savedToBankCount} soal disimpan ke Bank Soal`;
      }
      message.success(successMessage);

      // Add confirmation message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ ${successMessage}!\n\nApakah Anda ingin generate soal lagi? Ketik topik baru atau saya bisa membantu hal lain.`,
          timestamp: new Date(),
        },
      ]);

      setPendingQuestions([]);
      setSelectedQuestions(new Set());
      onQuestionsCreated();
    } catch (error) {
      message.error("Gagal menyimpan soal");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setPendingQuestions([]);
    setSelectedQuestions(new Set());
    setInputValue("");
    setTopic("");
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: "#8C59F1" }} />
          <span>
            AI Question Generator - {getQuestionTypeName(questionType)}
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <div style={{ display: "flex", gap: 16 }}>
        {/* Chat Section */}
        <div style={{ flex: 1 }}>
          {/* Chat Messages */}
          <div
            style={{
              height: 400,
              overflowY: "auto",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: 16,
              backgroundColor: "#fafafa",
              marginBottom: 16,
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  marginBottom: 16,
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <Avatar
                    icon={<RobotOutlined />}
                    style={{ backgroundColor: "#8C59F1", marginRight: 8 }}
                  />
                )}
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    backgroundColor: msg.role === "user" ? "#8C59F1" : "white",
                    color: msg.role === "user" ? "white" : "inherit",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 10,
                      color:
                        msg.role === "user"
                          ? "rgba(255,255,255,0.7)"
                          : undefined,
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </Text>
                </div>
                {msg.role === "user" && (
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#52c41a", marginLeft: 8 }}
                  />
                )}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  display: "flex",
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                <Avatar
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: "#8C59F1", marginRight: 8 }}
                />
                <Spin size="small" />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  AI sedang berpikir...
                </Text>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 Quick Generate:
            </Text>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <Input
                placeholder="Topik soal..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: 200 }}
              />
              <Button
                size="small"
                onClick={() => handleQuickGenerate(5, "easy")}
              >
                5 Soal Mudah
              </Button>
              <Button
                size="small"
                onClick={() => handleQuickGenerate(5, "medium")}
              >
                5 Soal Sedang
              </Button>
              <Button
                size="small"
                onClick={() => handleQuickGenerate(3, "hard")}
              >
                3 Soal Sulit
              </Button>
            </div>
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8 }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ketik pesan atau 'buat soal tentang [topik]'..."
              autoSize={{ minRows: 2, maxRows: 4 }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              style={{ height: "auto", backgroundColor: "#8C59F1" }}
            >
              Kirim
            </Button>
          </div>
        </div>

        {/* Generated Questions Panel */}
        {pendingQuestions.length > 0 && (
          <div
            style={{
              width: 350,
              borderLeft: "1px solid #f0f0f0",
              paddingLeft: 16,
            }}
          >
            <Title level={5} style={{ marginTop: 0 }}>
              <QuestionCircleOutlined /> Soal yang Digenerate (
              {pendingQuestions.length})
            </Title>

            <div style={{ marginBottom: 12 }}>
              <Checkbox
                checked={saveToBankSoal}
                onChange={(e) => setSaveToBankSoal(e.target.checked)}
              >
                <Tooltip title="Soal akan disimpan ke Bank Soal untuk digunakan di tryout lain">
                  <span>
                    Simpan juga ke Bank Soal <BulbOutlined />
                  </span>
                </Tooltip>
              </Checkbox>
            </div>

            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {pendingQuestions.map((q, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    marginBottom: 8,
                    border: selectedQuestions.has(index)
                      ? "2px solid #52c41a"
                      : "1px solid #f0f0f0",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleQuestionSelection(index)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Tag
                        color={
                          selectedQuestions.has(index) ? "success" : "default"
                        }
                        style={{ marginBottom: 4 }}
                      >
                        {selectedQuestions.has(index) ? (
                          <>
                            <CheckCircleOutlined /> Dipilih
                          </>
                        ) : (
                          "Klik untuk pilih"
                        )}
                      </Tag>
                      <p style={{ fontSize: 12, margin: 0 }}>
                        {q.text.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveQuestions}
              loading={saving}
              block
              style={{
                marginTop: 12,
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
              }}
              disabled={selectedQuestions.size === 0}
            >
              {saving
                ? "Menyimpan..."
                : `Simpan ${selectedQuestions.size} Soal`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalAIChatbot;
