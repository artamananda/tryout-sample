import { useState, useRef, useEffect } from "react";
import {
  Input,
  Button,
  Typography,
  Card,
  message,
  Spin,
  Checkbox,
  Tag,
  Avatar,
  Select,
  Modal,
  Drawer,
} from "antd";
import {
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  EditOutlined,
  BookOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import {
  apiChat,
  apiSaveToBankSoal,
  apiSaveChatLog,
  apiGetHistory,
  apiGetSession,
  apiDeleteSession,
  apiUpdateSession,
  apiSaveExample,
  apiGetSessionArtifacts,
} from "../../api/ai";
import { apiCreateQuestion } from "../../api/question";
import {
  AIChatMessage,
  GeneratedQuestion,
  CreateBankSoalRequest,
  ChatLog,
  ChatArtifact,
} from "../../types/ai.type";

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface AIChatViewProps {
  tryoutId?: string;
  questionType?: string;
  onQuestionsCreated?: () => void;
  onClose?: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  questions?: GeneratedQuestion[];
}

const QUESTION_TYPES = [
  { value: "kpu", label: "Penalaran Umum (KPU)" },
  { value: "ppu", label: "Pengetahuan dan Pemahaman Umum (PPU)" },
  { value: "pbm", label: "Pemahaman Bacaan dan Menulis (PBM)" },
  { value: "pku", label: "Pengetahuan Kuantitatif (PKU)" },
  { value: "ind", label: "Literasi Bahasa Indonesia (IND)" },
  { value: "ing", label: "Literasi Bahasa Inggris (ING)" },
  { value: "mtk", label: "Penalaran Matematika (MTK)" },
];

const AIChatView = ({
  tryoutId,
  questionType: initialQuestionType,
  onQuestionsCreated,
  onClose,
}: AIChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [saveToBankSoal, setSaveToBankSoal] = useState(true);
  const [pendingQuestions, setPendingQuestions] = useState<GeneratedQuestion[]>(
    []
  );
  const [topic, setTopic] = useState("");
  const [selectedType, setSelectedType] = useState(
    initialQuestionType || "kpu"
  );

  // History State
  const [history, setHistory] = useState<ChatLog[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [editingQuestionData, setEditingQuestionData] =
    useState<GeneratedQuestion | null>(null);

  // Save Example State
  const [isSaveExampleModalVisible, setIsSaveExampleModalVisible] =
    useState(false);
  const [exampleContent, setExampleContent] = useState("");
  const [exampleTopic, setExampleTopic] = useState("");

  // Artifacts State
  const [artifacts, setArtifacts] = useState<ChatArtifact[]>([]);
  const [isArtifactDrawerVisible, setIsArtifactDrawerVisible] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeQuestionType = initialQuestionType || selectedType;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadHistory();
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Halo! Saya AI Assistant. 🎓\n\n1. **Ngobrol** - Diskusikan topik\n2. **Generate Soal** - Ketik "buat soal tentang [topik]"\n\nSilakan mulai!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (isArtifactDrawerVisible && sessionId) {
      const fetchArtifacts = async () => {
        const res = await apiGetSessionArtifacts(sessionId);
        if (res) {
          setArtifacts(res);
        }
      };
      fetchArtifacts();
    } else {
      setArtifacts([]); // Clear artifacts when drawer is closed or session changes
    }
  }, [isArtifactDrawerVisible, sessionId]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const res = await apiGetHistory();
    if (res) setHistory(res);
    setHistoryLoading(false);
  };

  const handleLoadSession = async (id: string) => {
    setLoading(true);
    const session = await apiGetSession(id);
    if (session) {
      setSessionId(session.chat_log_id);
      setTopic(session.topic);
      // Convert messages
      const converted: Message[] = session.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(), // We don't have detailed timestamps per message in DB json
      }));
      setMessages(converted);
      // If we have question types in history, set it?
      if (session.question_type) setSelectedType(session.question_type);
    }
    setLoading(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await apiDeleteSession(id);
    loadHistory();
    if (sessionId === id) {
      handleNewChat();
    }
  };

  const handleNewChat = () => {
    setSessionId(undefined);
    setTopic("");
    setMessages([
      {
        role: "assistant",
        content: `Halo! Saya AI Assistant. 🎓\n\n1. **Ngobrol** - Diskusikan topik\n2. **Generate Soal** - Ketik "buat soal tentang [topik]"\n\nSilakan mulai!`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleEditSession = (
    e: React.MouseEvent,
    id: string,
    currentTitle: string
  ) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveSessionTitle = async () => {
    if (editingSessionId && editTitle.trim()) {
      await apiUpdateSession(editingSessionId, editTitle);
      loadHistory();
      setEditingSessionId(null);
    }
  };

  const handleEditQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setEditingQuestionData(JSON.parse(JSON.stringify(pendingQuestions[index])));
    setIsEditModalVisible(true);
  };

  const handleSaveQuestion = () => {
    if (editingQuestionIndex >= 0 && editingQuestionData) {
      const newQuestions = [...pendingQuestions];
      newQuestions[editingQuestionIndex] = editingQuestionData;
      setPendingQuestions(newQuestions);
      setIsEditModalVisible(false);
      setEditingQuestionIndex(-1);
      setEditingQuestionData(null);
    }
  };

  const handleOpenSaveExample = (content: string) => {
    setExampleContent(content);
    setExampleTopic(topic || "");
    setIsSaveExampleModalVisible(true);
  };

  const handleSaveExample = async () => {
    if (exampleContent && exampleTopic) {
      const success = await apiSaveExample(exampleTopic, exampleContent);
      if (success) {
        message.success("Berhasil disimpan ke dataset!");
        setIsSaveExampleModalVisible(false);
      }
    }
  };

  const getQuestionTypeName = (code: string) => {
    const type = QUESTION_TYPES.find((t) => t.value === code);
    return type ? type.label : code.toUpperCase();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const isGenerateRequest =
        inputValue.toLowerCase().includes("buat soal") ||
        inputValue.toLowerCase().includes("generate") ||
        inputValue.toLowerCase().includes("buatkan");

      const chatMessages: AIChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      chatMessages.push({ role: "user", content: inputValue });

      const response = await apiChat({
        session_id: sessionId,
        topic: topic,
        messages: chatMessages,
        question_type: activeQuestionType,
        mode: isGenerateRequest ? "generate" : "chat",
      });

      if (response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.message,
            questions: response.questions,
            timestamp: new Date(),
          },
        ]);

        if (response.questions && response.questions.length > 0) {
          setPendingQuestions(response.questions);
          const topicMatch = inputValue.match(/tentang\s+(.+)/i);
          if (topicMatch) setTopic(topicMatch[1].trim());
          setSelectedQuestions(new Set(response.questions.map((_, i) => i)));
        }

        if (response.session_id) {
          setSessionId(response.session_id);
          if (!sessionId) loadHistory(); // Refresh history if new session
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
    setInputValue(
      `Buat ${count} soal ${diff} tentang ${topic} untuk ${getQuestionTypeName(
        activeQuestionType
      )}`
    );
  };

  const handleSaveLog = async () => {
    if (messages.length === 0) return;
    setSavingLog(true);
    try {
      const chatMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const success = await apiSaveChatLog({
        question_type: activeQuestionType,
        topic: topic || "General",
        messages: chatMessages,
      });
      if (success) {
        message.success("Tersimpan untuk proses background");
        if (onClose) onClose();
      }
    } finally {
      setSavingLog(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (selectedQuestions.size === 0) return;
    setSaving(true);
    try {
      const selectedQs = pendingQuestions.filter((_, i) =>
        selectedQuestions.has(i)
      );
      let savedToBank = 0;
      let savedToTryout = 0;

      if (saveToBankSoal) {
        const bankData: CreateBankSoalRequest[] = selectedQs.map((q) => ({
          type: activeQuestionType,
          text: q.text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: "medium", // Default
          topic: topic,
          is_ai_generated: true,
          is_options: true,
        }));
        const res = await apiSaveToBankSoal({ questions: bankData });
        if (res) savedToBank = res.length;
      }

      if (tryoutId) {
        for (let i = 0; i < selectedQs.length; i++) {
          const q = selectedQs[i];
          const res = await apiCreateQuestion({
            tryout_id: tryoutId,
            local_id: i + 1,
            type: activeQuestionType,
            text: q.text,
            options: q.options,
            correct_answer: q.correct_answer,
            is_options: true,
          });
          if (res) savedToTryout++;
        }
      }

      message.success(
        `Tersimpan: ${savedToTryout} Tryout, ${savedToBank} Bank Soal`
      );
      setPendingQuestions([]);
      setSelectedQuestions(new Set());
      if (onQuestionsCreated) onQuestionsCreated();
    } catch (err) {
      message.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestionSelection = (index: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        height: "100%",
        flexDirection: "row",
      }}
    >
      {/* History Sidebar */}
      <div
        style={{
          width: 260,
          backgroundColor: "#fff",
          borderRadius: 24,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          border: "1px solid #f0f0f0",
        }}
      >
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={handleNewChat}
          style={{
            marginBottom: 16,
            height: 40,
            borderRadius: 12,
            borderColor: "#8C59F1",
            color: "#8C59F1",
          }}
        >
          New Chat
        </Button>

        <Text
          type="secondary"
          style={{ fontSize: 12, marginBottom: 8, paddingLeft: 4 }}
        >
          History
        </Text>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {historyLoading ? (
            <Spin style={{ display: "block", margin: "20px auto" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((item) => (
                <div
                  key={item.chat_log_id}
                  onClick={() => handleLoadSession(item.chat_log_id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    backgroundColor:
                      sessionId === item.chat_log_id
                        ? "#f9f0ff"
                        : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.2s",
                    border:
                      sessionId === item.chat_log_id
                        ? "1px solid #efdbff"
                        : "1px solid transparent",
                  }}
                  className="history-item"
                >
                  <MessageOutlined
                    style={{
                      color:
                        sessionId === item.chat_log_id ? "#8C59F1" : "#999",
                    }}
                  />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    {editingSessionId === item.chat_log_id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveSessionTitle}
                        onPressEnter={handleSaveSessionTitle}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        style={{ height: 24, fontSize: 13 }}
                      />
                    ) : (
                      <>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#333",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.topic || "Untitled Chat"}
                        </div>
                        <div style={{ fontSize: 10, color: "#999" }}>
                          {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </div>
                  {editingSessionId !== item.chat_log_id && (
                    <div
                      className="actions"
                      style={{ display: "flex", gap: 4 }}
                    >
                      <EditOutlined
                        style={{ fontSize: 12, color: "#1890ff", opacity: 0.7 }}
                        onClick={(e) =>
                          handleEditSession(e, item.chat_log_id, item.topic)
                        }
                      />
                      <DeleteOutlined
                        className="delete-icon"
                        style={{ fontSize: 12, color: "#ff4d4f", opacity: 0.5 }}
                        onClick={(e) =>
                          handleDeleteSession(e, item.chat_log_id)
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
              {history.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#ccc",
                    marginTop: 20,
                    fontSize: 13,
                  }}
                >
                  Belum ada riwayat
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Header/Controls */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px",
          }}
        >
          {!initialQuestionType ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Text strong style={{ fontSize: 16 }}>
                Jenis Soal:
              </Text>
              <Select
                value={selectedType}
                onChange={setSelectedType}
                options={QUESTION_TYPES}
                style={{ width: 280 }}
                size="large"
                variant="borderless"
                suffixIcon={
                  <QuestionCircleOutlined style={{ color: "#8C59F1" }} />
                }
                listHeight={300}
              />
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setIsArtifactDrawerVisible(true)}
            >
              History Generasi
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            backgroundColor: "#f9f9f9",
            border: "1px solid #f0f0f0",
            backgroundImage: "radial-gradient(#e6e6e6 1px, transparent 1px)", // Subtle pattern
            backgroundSize: "20px 20px",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                marginBottom: 24,
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end",
              }}
            >
              {msg.role === "assistant" && (
                <Avatar
                  icon={<RobotOutlined style={{ fontSize: 20 }} />}
                  style={{
                    backgroundColor: "#fff",
                    color: "#8C59F1",
                    marginRight: 12,
                    border: "1px solid #8C59F1",
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(140, 89, 241, 0.2)",
                  }}
                />
              )}

              <div
                style={{
                  maxWidth: "75%",
                  padding: "16px 20px",
                  borderRadius:
                    msg.role === "user"
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                  backgroundColor: msg.role === "user" ? "#8C59F1" : "white",
                  color: msg.role === "user" ? "white" : "#333",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border:
                    msg.role === "assistant" ? "1px solid #f0f0f0" : "none",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ whiteSpace: "pre-wrap", fontSize: 15 }}>
                  {msg.content}
                </div>
                {msg.questions && msg.questions.length > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {msg.questions.map((q, qIdx) => (
                      <Card
                        key={qIdx}
                        size="small"
                        style={{
                          border: "1px solid #eee",
                          background: "#fafafa",
                        }}
                        hoverable
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                          }}
                        >
                          <Text
                            ellipsis={{ tooltip: q.text }}
                            style={{ maxWidth: "90%" }}
                          >
                            <span
                              style={{ fontWeight: "bold", marginRight: 4 }}
                            >
                              #{qIdx + 1}
                            </span>
                            {q.text}
                          </Text>
                          {/* View/Edit Trigger could go here */}
                        </div>
                        <div
                          style={{ marginTop: 4, fontSize: 11, color: "#999" }}
                        >
                          Type: {q.type} | Options: {q.options.length}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Message Metadata */}
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 4,
                    fontSize: 11,
                    opacity: 0.7,
                    color:
                      msg.role === "user" ? "rgba(255,255,255,0.9)" : "#999",
                  }}
                >
                  {msg.role === "user" && (
                    <BookOutlined
                      style={{ cursor: "pointer", marginRight: 4 }}
                      title="Simpan sebagai Dataset"
                      onClick={() => handleOpenSaveExample(msg.content)}
                    />
                  )}
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {msg.role === "assistant" && (
                    <CheckCircleOutlined style={{ fontSize: 10 }} />
                  )}
                </div>
              </div>

              {msg.role === "user" && (
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: "#52c41a",
                    marginLeft: 12,
                    boxShadow: "0 2px 8px rgba(82, 196, 26, 0.2)",
                  }}
                />
              )}
            </div>
          ))}

          {loading && (
            <div
              style={{ display: "flex", alignItems: "center", marginLeft: 8 }}
            >
              <Spin
                indicator={
                  <RobotOutlined
                    style={{ fontSize: 24, color: "#8C59F1" }}
                    spin
                  />
                }
              />
              <Text
                type="secondary"
                style={{ marginLeft: 16, fontStyle: "italic" }}
              >
                Sedang mengetik...
              </Text>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area Wrapper */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 24,
            padding: "16px 20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid #f0f0f0",
          }}
        >
          {/* Quick Actions (Pills) */}
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            <Tag
              icon={<ClockCircleOutlined />}
              color="processing"
              style={{
                borderRadius: 16,
                padding: "4px 12px",
                cursor: "pointer",
                border: "1px solid #d9d9d9",
              }}
              onClick={handleSaveLog}
            >
              {savingLog ? "Menyimpan..." : "Proses Background"}
            </Tag>
            <div
              style={{ width: 1, backgroundColor: "#eee", margin: "0 4px" }}
            />

            {[
              { label: "5 Mudah", count: 5, diff: "easy" },
              { label: "5 Sedang", count: 5, diff: "medium" },
              { label: "3 Sulit", count: 3, diff: "hard" },
            ].map((action, idx) => (
              <Tag
                key={idx}
                color="purple"
                style={{
                  borderRadius: 16,
                  padding: "4px 12px",
                  cursor: "pointer",
                  backgroundColor: "#f9f0ff",
                  color: "#8C59F1",
                  border: "1px solid #efdbff",
                }}
                onClick={() => handleQuickGenerate(action.count, action.diff)}
              >
                {action.label}
              </Tag>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ketik pesan atau topik soal..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              bordered={false}
              style={{
                flex: 1,
                padding: "8px 0",
                resize: "none",
                fontSize: 15,
                backgroundColor: "transparent",
              }}
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
              shape="circle"
              icon={<SendOutlined style={{ marginLeft: 2 }} />}
              size="large"
              onClick={handleSend}
              loading={loading}
              style={{
                backgroundColor: "#8C59F1",
                boxShadow: "0 4px 12px rgba(140, 89, 241, 0.4)",
                border: "none",
                minWidth: 40,
                height: 40,
              }}
            />
          </div>

          {/* Topic Input (Subtle) */}
          {topic && (
            <div
              style={{
                marginTop: 8,
                borderTop: "1px solid #f5f5f5",
                paddingTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Topik Aktif:
              </Text>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                size="small"
                bordered={false}
                style={{
                  width: 200,
                  fontSize: 12,
                  color: "#8C59F1",
                  fontWeight: 600,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Generated Questions Sidebar */}
      {pendingQuestions.length > 0 && (
        <div
          style={{
            width: 340,
            paddingLeft: 20,
            borderLeft: "1px solid #f0f0f0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f6ffed",
              borderRadius: 16,
              marginBottom: 16,
              border: "1px solid #b7eb8f",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Title level={5} style={{ margin: 0, color: "#389e0d" }}>
                <QuestionCircleOutlined /> Generated ({pendingQuestions.length})
              </Title>
              <Tag color="success">{selectedQuestions.size} Dipilih</Tag>
            </div>
            <Checkbox
              checked={saveToBankSoal}
              onChange={(e) => setSaveToBankSoal(e.target.checked)}
              style={{ fontSize: 13 }}
            >
              Simpan ke Bank Soal <BulbOutlined style={{ color: "#fa8c16" }} />
            </Checkbox>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
            {pendingQuestions.map((q, i) => (
              <div
                key={i}
                onClick={() => toggleQuestionSelection(i)}
                style={{
                  padding: 12,
                  marginBottom: 12,
                  borderRadius: 12,
                  backgroundColor: "white",
                  border: selectedQuestions.has(i)
                    ? "2px solid #52c41a"
                    : "1px solid #f0f0f0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Tag
                    color={selectedQuestions.has(i) ? "green" : "default"}
                    style={{ margin: 0 }}
                  >
                    #{i + 1}
                  </Tag>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditQuestion(i);
                    }}
                    style={{ height: 20, fontSize: 12, color: "#1890ff" }}
                  />
                </div>
                <div style={{ fontSize: 13, lineHeight: "1.5", color: "#444" }}>
                  {q.text.substring(0, 120)}
                  {q.text.length > 120 ? "..." : ""}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="primary"
            onClick={handleSaveQuestions}
            loading={saving}
            disabled={selectedQuestions.size === 0}
            size="large"
            icon={<SaveOutlined />}
            block
            style={{
              marginTop: 16,
              borderRadius: 12,
              height: 44,
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
            }}
          >
            Simpan Soal
          </Button>
        </div>
      )}
      <Modal
        title="Edit Question"
        open={isEditModalVisible}
        onOk={handleSaveQuestion}
        onCancel={() => setIsEditModalVisible(false)}
        width={600}
      >
        {editingQuestionData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Typography.Text strong>Question Text:</Typography.Text>
              <Input.TextArea
                rows={3}
                value={editingQuestionData.text}
                onChange={(e) =>
                  setEditingQuestionData({
                    ...editingQuestionData,
                    text: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Typography.Text strong>Options:</Typography.Text>
              {editingQuestionData.options.map((opt, idx) => (
                <Input
                  key={idx}
                  addonBefore={String.fromCharCode(65 + idx)}
                  value={opt}
                  style={{ marginBottom: 8 }}
                  onChange={(e) => {
                    const newOpts = [...editingQuestionData.options];
                    newOpts[idx] = e.target.value;
                    setEditingQuestionData({
                      ...editingQuestionData,
                      options: newOpts,
                    });
                  }}
                />
              ))}
            </div>
            <div>
              <Typography.Text strong>Correct Answer:</Typography.Text>
              <Select
                value={editingQuestionData.correct_answer}
                onChange={(val) =>
                  setEditingQuestionData({
                    ...editingQuestionData,
                    correct_answer: val,
                  })
                }
                style={{ width: "100%" }}
                options={editingQuestionData.options.map((opt, idx) => ({
                  label: opt || `Option ${String.fromCharCode(65 + idx)}`,
                  value: opt,
                }))}
              />
            </div>
            <div>
              <Typography.Text strong>Explanation:</Typography.Text>
              <Input.TextArea
                rows={2}
                value={editingQuestionData.explanation}
                onChange={(e) =>
                  setEditingQuestionData({
                    ...editingQuestionData,
                    explanation: e.target.value,
                  })
                }
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Simpan ke Dataset AI"
        open={isSaveExampleModalVisible}
        onOk={handleSaveExample}
        onCancel={() => setIsSaveExampleModalVisible(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Typography.Text type="secondary">
            Simpan prompt ini sebagai referensi untuk generate soal di masa
            depan.
          </Typography.Text>
          <div>
            <Typography.Text strong>Topik:</Typography.Text>
            <Input
              value={exampleTopic}
              onChange={(e) => setExampleTopic(e.target.value)}
              placeholder="Topik Soal (misal: Aljabar)"
            />
          </div>
          <div>
            <Typography.Text strong>Konten Prompt:</Typography.Text>
            <Input.TextArea
              rows={4}
              value={exampleContent}
              onChange={(e) => setExampleContent(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Drawer
        title="Riwayat Generasi Soal"
        placement="right"
        onClose={() => setIsArtifactDrawerVisible(false)}
        open={isArtifactDrawerVisible}
        width={400}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {artifacts.map((art) => (
            <Card
              key={art.id}
              size="small"
              title={
                <span style={{ fontSize: 12 }}>
                  {new Date(art.created_at).toLocaleString()}
                </span>
              }
              extra={<Tag color="blue">{art.status}</Tag>}
            >
              <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }}>
                <b>Q: </b> {art.content.text}
              </Typography.Paragraph>
              <Typography.Paragraph type="secondary" style={{ fontSize: 11 }}>
                <b>Ref:</b> {art.metadata?.source || "AI Generated"}
                {art.references_data && art.references_data.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    Using {art.references_data.length} Examples
                  </div>
                )}
              </Typography.Paragraph>
            </Card>
          ))}
          {artifacts.length === 0 && (
            <div style={{ textAlign: "center", color: "#999" }}>
              Belum ada item yang digenerate.
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default AIChatView;
