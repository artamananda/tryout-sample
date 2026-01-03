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
  UploadOutlined,
  RedoOutlined,
  LoadingOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import ModalEditQuestion, { EditQuestionData } from "../Ui/ModalEditQuestion";

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
  apiUploadContext,
  apiRefineArtifact,
  apiUpdateArtifact,
  apiDeleteArtifact,
  apiApproveArtifact,
} from "../../api/ai";
import { apiCreateQuestion } from "../../api/question";
import {
  AIChatMessage,
  AIChatRequest,
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
  artifact_ids?: string[];
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

  // File Context State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContext, setFileContext] = useState<{
    text: string;
    name: string;
  } | null>(null);

  // Refine State
  const [isRefineModalVisible, setIsRefineModalVisible] = useState(false);
  const [refineArtifactId, setRefineArtifactId] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);

  // Edit Artifact State
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] =
    useState<string>("multiple_choice");

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

  const handleEditArtifact = (art: ChatArtifact) => {
    setEditingArtifactId(art.id);
    // Ensure content matches GeneratedQuestion structure. It usually does.
    setEditingQuestionData(art.content);
    setIsEditModalVisible(true);
  };

  const handleSaveQuestion = async (newData?: any) => {
    // If newData provided directly from Modal onSave
    const dataToSave = newData || editingQuestionData;

    if (editingArtifactId && dataToSave) {
      const updated = await apiUpdateArtifact(editingArtifactId, dataToSave);
      if (updated) {
        message.success("Artifact Updated");
        if (sessionId) {
          const arts = await apiGetSessionArtifacts(sessionId);
          if (arts) setArtifacts(arts);
        }
        setIsEditModalVisible(false);
        setEditingArtifactId(null);
        setEditingQuestionData(null);
      }
      return;
    }

    if (editingQuestionIndex >= 0 && dataToSave) {
      const newQuestions = [...pendingQuestions];
      newQuestions[editingQuestionIndex] = dataToSave;
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
    if (!exampleTopic || !exampleContent) return;
    const ok = await apiSaveExample(exampleTopic, exampleContent);
    if (ok) {
      message.success("Prompt saved to dataset");
      setIsSaveExampleModalVisible(false);
      setExampleTopic("");
      setExampleContent("");
    }
  };

  const handleOpenRefine = (id: string) => {
    setRefineArtifactId(id);
    setRefineInstruction("");
    setIsRefineModalVisible(true);
  };

  const handleRefineSubmit = async () => {
    if (!refineArtifactId || !refineInstruction) return;
    setRefineLoading(true);
    const updated = await apiRefineArtifact(
      refineArtifactId,
      refineInstruction
    );
    setRefineLoading(false);
    if (updated) {
      message.success("Artifact Refined");
      setIsRefineModalVisible(false);
      // Refresh artifacts
      if (sessionId) {
        const arts = await apiGetSessionArtifacts(sessionId);
        if (arts) setArtifacts(arts);
      }
    }
  };

  const handleDeleteArtifact = async (id: string) => {
    Modal.confirm({
      title: "Delete Artifact",
      content: "Are you sure you want to delete this generated item?",
      onOk: async () => {
        const success = await apiDeleteArtifact(id);
        if (success) {
          message.success("Deleted");
          if (sessionId) {
            const arts = await apiGetSessionArtifacts(sessionId);
            if (arts) setArtifacts(arts);
          }
        }
      },
    });
  };

  const handleAddToBankSoalSingle = async (art: ChatArtifact) => {
    // If already approved, ask specific confirmation or just allow re-save (create new?)
    // User wants "Addedtable". So maybe just add.
    if (!sessionId || actionLoading) return;

    setActionLoading(art.id);
    // Construct Bank Soal Request
    const bankData: CreateBankSoalRequest = {
      type: activeQuestionType, // Fallback to activeQuestionType
      // Note: "source_type" field might not exist in GeneratedQuestion interface yet in frontend, check ai.type.ts if needed.
      // GeneratedQuestion in ai.type.ts: text, options, correct_answer, explanation. No type.
      // We will fallback to activeQuestionType or user select?
      // Risk: If I generated 'kpu' but switch select to 'ppu', it saves as 'ppu'.
      // Acceptable for now.
      text: art.content.text,
      options: art.content.options,
      correct_answer: art.content.correct_answer,
      explanation: art.content.explanation,
      difficulty: "medium",
      topic: topic,
      is_ai_generated: true,
      is_options: !!(art.content.options && art.content.options.length > 0),
    };

    const res = await apiSaveToBankSoal({ questions: [bankData] });
    if (res) {
      await apiApproveArtifact(art.id);
      message.success("Saved to Bank Soal");
      // Refresh
      const arts = await apiGetSessionArtifacts(sessionId);
      if (arts) setArtifacts(arts);
    }
    setActionLoading(null);
  };

  const getQuestionTypeName = (code: string) => {
    const type = QUESTION_TYPES.find((t) => t.value === code);
    return type ? type.label : code.toUpperCase();
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !fileContext) || loading) return;

    let finalContent = inputValue;
    if (fileContext) {
      finalContent = `[Context from Attached File: ${fileContext.name}]\n${fileContext.text}\n\n${inputValue}`;
    }

    const userMessage: Message = {
      role: "user",
      content: finalContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setFileContext(null); // Clear after send
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
      chatMessages.push({ role: "user", content: finalContent });

      const reqData: AIChatRequest = {
        session_id: sessionId,
        topic: topic,
        messages: chatMessages,
        question_type: activeQuestionType,
        question_format: selectedFormat,
        mode: isGenerateRequest ? "generate" : "chat",
      };

      const response = await apiChat(reqData);

      if (response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.message,
            questions: response.questions,
            artifact_ids: response.artifact_ids,
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
        fontFamily: "'Inter', sans-serif", // Ensure font if available, or inherit
      }}
    >
      {/* History Sidebar */}
      <div
        style={{
          width: 280,
          backgroundColor: "#fff",
          borderRadius: 24,
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #f0f0f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        }}
      >
        <Button
          type="primary"
          block
          icon={<PlusOutlined />}
          onClick={handleNewChat}
          style={{
            marginBottom: 24,
            height: 48,
            borderRadius: 16,
            background: "linear-gradient(135deg, #8C59F1 0%, #9e73f8 100%)",
            border: "none",
            boxShadow: "0 4px 14px rgba(140, 89, 241, 0.3)",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          New Chat
        </Button>

        <Text
          type="secondary"
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#999",
            marginBottom: 12,
            paddingLeft: 8,
          }}
        >
          History
        </Text>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
          {historyLoading ? (
            <div style={{ padding: 20, textAlign: "center" }}>
              <Spin
                indicator={
                  <LoadingOutlined
                    style={{ fontSize: 24, color: "#8C59F1" }}
                    spin
                  />
                }
              />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {history.map((item) => (
                <div
                  key={item.chat_log_id}
                  onClick={() => handleLoadSession(item.chat_log_id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    backgroundColor:
                      sessionId === item.chat_log_id
                        ? "#f5ebff"
                        : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    border:
                      sessionId === item.chat_log_id
                        ? "1px solid #d3adf7"
                        : "1px solid transparent",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  className="history-item"
                  onMouseEnter={(e) => {
                    if (sessionId !== item.chat_log_id)
                      e.currentTarget.style.backgroundColor = "#fafafa";
                  }}
                  onMouseLeave={(e) => {
                    if (sessionId !== item.chat_log_id)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor:
                        sessionId === item.chat_log_id ? "#fff" : "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color:
                        sessionId === item.chat_log_id ? "#8C59F1" : "#ccc",
                    }}
                  >
                    <MessageOutlined style={{ fontSize: 16 }} />
                  </div>

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
                        style={{ height: 26, fontSize: 13, borderRadius: 6 }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight:
                              sessionId === item.chat_log_id ? 600 : 500,
                            color:
                              sessionId === item.chat_log_id ? "#222" : "#444",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.topic || "Untitled Chat"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              sessionId === item.chat_log_id
                                ? "#8C59F1"
                                : "#aaa",
                          }}
                        >
                          {new Date(item.updated_at).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subtle Actions showing only on active or special hover class (css dependent, or static for now) */}
                  {editingSessionId !== item.chat_log_id &&
                    sessionId === item.chat_log_id && (
                      <div
                        className="actions"
                        style={{ display: "flex", gap: 6 }}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ fontSize: 14 }} />}
                          onClick={(e) =>
                            handleEditSession(e, item.chat_log_id, item.topic)
                          }
                          style={{
                            color: "#1890ff",
                            minWidth: 24,
                            height: 24,
                            padding: 0,
                          }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                          onClick={(e) =>
                            handleDeleteSession(e, item.chat_log_id)
                          }
                          style={{
                            color: "#ff4d4f",
                            minWidth: 24,
                            height: 24,
                            padding: 0,
                          }}
                        />
                      </div>
                    )}
                </div>
              ))}
              {history.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#999",
                    marginTop: 40,
                    fontSize: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <InboxOutlined style={{ fontSize: 32, opacity: 0.3 }} />
                  <span>Belum ada riwayat chat</span>
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
                {msg.artifact_ids && msg.artifact_ids.length > 0 ? (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#8C59F1",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 500,
                      }}
                    >
                      <HistoryOutlined /> Generated Questions (Checkpoint)
                    </div>
                    {artifacts
                      .filter((art) => msg.artifact_ids?.includes(art.id))
                      .map((art) => (
                        <Card
                          key={art.id}
                          size="small"
                          style={{
                            border: "1px solid #efdbff",
                            background: "#fcf7ff",
                          }}
                          title={
                            <span style={{ fontSize: 11, color: "#8C59F1" }}>
                              {art.content.type
                                ? art.content.type
                                    .replace("_", " ")
                                    .toUpperCase()
                                : "QUESTION"}
                            </span>
                          }
                          extra={
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditArtifact(art)}
                            />
                          }
                        >
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 13,
                              marginBottom: 4,
                            }}
                          >
                            {art.content.text}
                          </div>
                          <div style={{ fontSize: 11, color: "#666" }}>
                            Key: <b>{art.content.correct_answer}</b>
                          </div>
                        </Card>
                      ))}
                  </div>
                ) : (
                  msg.questions &&
                  msg.questions.length > 0 && (
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
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: "#999",
                            }}
                          >
                            Type: {q.type} | Options: {q.options.length}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
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
          {/* Top Bar: Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
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

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Select
                value={selectedFormat}
                onChange={(val) => setSelectedFormat(val)}
                style={{ width: 140 }}
                size="small"
                options={[
                  { label: "PG Tunggal", value: "multiple_choice" },
                  { label: "PG Majemuk", value: "multiple_answer" },
                  { label: "Isian Singkat", value: "short_answer" },
                  { label: "Essay / Uraian", value: "essay" },
                ]}
              />
              <div style={{ display: "flex", gap: 4 }}>
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
                    onClick={() =>
                      handleQuickGenerate(action.count, action.diff)
                    }
                  >
                    {action.label}
                  </Tag>
                ))}
              </div>
            </div>
          </div>

          {/* File Context Info */}
          {fileContext && (
            <div style={{ margin: "0 0 8px 4px" }}>
              <Tag closable onClose={() => setFileContext(null)} color="blue">
                Attached: {fileContext.name}
              </Tag>
            </div>
          )}

          {/* Main Input Area */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              backgroundColor: "#f8f9fa",
              padding: "8px 12px",
              borderRadius: 16,
              border: "1px solid #eee",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const res = await apiUploadContext(file);
                  if (res) {
                    setFileContext({ text: res.text, name: res.filename });
                    message.success("Context loaded");
                  }
                }
              }}
              style={{ display: "none" }}
            />
            <Button
              icon={<UploadOutlined />}
              type="text"
              shape="circle"
              onClick={() => fileInputRef.current?.click()}
              style={{ color: "#666" }}
            />

            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ketik pesan atau topik soal..."
              autoSize={{ minRows: 1, maxRows: 6 }}
              bordered={false}
              style={{
                flex: 1,
                padding: "6px 0",
                resize: "none",
                fontSize: 15,
                backgroundColor: "transparent",
                lineHeight: 1.5,
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
              icon={<SendOutlined style={{ marginLeft: 3 }} />}
              size="large"
              onClick={handleSend}
              loading={loading}
              style={{
                backgroundColor: "#8C59F1",
                boxShadow: "0 4px 12px rgba(140, 89, 241, 0.3)",
                border: "none",
                minWidth: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </div>

          {/* Topic Input (Subtle Footer) */}
          {topic && (
            <div
              style={{
                marginTop: 8,
                paddingTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingLeft: 4,
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
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
                  padding: 0,
                }}
              />
            </div>
          )}
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
                  <QuestionCircleOutlined /> Generated (
                  {pendingQuestions.length})
                </Title>
                <Tag color="success">{selectedQuestions.size} Dipilih</Tag>
              </div>
              <Checkbox
                checked={saveToBankSoal}
                onChange={(e) => setSaveToBankSoal(e.target.checked)}
                style={{ fontSize: 13 }}
              >
                Simpan ke Bank Soal{" "}
                <BulbOutlined style={{ color: "#fa8c16" }} />
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
                  <div
                    style={{ fontSize: 13, lineHeight: "1.5", color: "#444" }}
                  >
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
        <ModalEditQuestion
          isModalOpen={isEditModalVisible}
          setIsModalOpen={setIsEditModalVisible}
          initialData={editingQuestionData}
          onSave={handleSaveQuestion}
          title={
            editingArtifactId
              ? "Edit Generated Question"
              : "Edit Pending Question"
          }
        />

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

        <Modal
          title="Refine Generated Question"
          open={isRefineModalVisible}
          onOk={handleRefineSubmit}
          confirmLoading={refineLoading}
          onCancel={() => setIsRefineModalVisible(false)}
        >
          <Typography.Paragraph type="secondary">
            Provide instructions to AI on how to improve this question.
          </Typography.Paragraph>
          <Input.TextArea
            rows={4}
            placeholder="e.g. Make it closer to UTBK 2024 style, or fix the calculation error..."
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
          />
        </Modal>

        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <HistoryOutlined style={{ color: "#8C59F1", fontSize: 18 }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  Riwayat Generasi
                </span>
                <span style={{ fontWeight: 400, fontSize: 11, color: "#999" }}>
                  Tracking Generated Questions
                </span>
              </div>
            </div>
          }
          placement="right"
          onClose={() => setIsArtifactDrawerVisible(false)}
          open={isArtifactDrawerVisible}
          width={420}
          headerStyle={{
            borderBottom: "1px solid #f0f0f0",
            padding: "16px 24px",
          }}
          bodyStyle={{ backgroundColor: "#fafafa", padding: "20px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {artifacts.map((art) => (
              <div
                key={art.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: "16px",
                  border: "1px solid #eee",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                {/* Status Strip */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor:
                      art.status === "approved" ? "#52c41a" : "#8C59F1",
                  }}
                />

                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                    paddingLeft: 10,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: "#999" }}
                  >
                    {new Date(art.created_at).toLocaleString()}
                  </span>
                  <Tag
                    color={art.status === "approved" ? "success" : "purple"}
                    style={{ marginRight: 0, fontSize: 10, border: "none" }}
                  >
                    {art.status.toUpperCase()}
                  </Tag>
                </div>

                {/* Content */}
                <div style={{ paddingLeft: 10, marginBottom: 12 }}>
                  <Typography.Paragraph
                    ellipsis={{ rows: 3, expandable: true }}
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#333",
                      lineHeight: "1.6",
                    }}
                  >
                    {art.content.text}
                  </Typography.Paragraph>
                  {art.metadata?.source && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        color: "#aaa",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <BookOutlined /> Ref: {art.metadata.source}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    paddingLeft: 10,
                    marginTop: 12,
                    borderTop: "1px solid #f7f7f7",
                    paddingTop: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditArtifact(art)}
                    style={{
                      fontSize: 12,
                      color: "#666",
                      backgroundColor: "#f9f9f9",
                      borderRadius: 6,
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    type="text"
                    icon={<RedoOutlined />}
                    onClick={() => handleOpenRefine(art.id)}
                    style={{
                      fontSize: 12,
                      color: "#666",
                      backgroundColor: "#f9f9f9",
                      borderRadius: 6,
                    }}
                  >
                    Refine
                  </Button>

                  <div style={{ flex: 1 }} />

                  {art.status === "approved" ? (
                    <Button
                      size="small"
                      type="text"
                      icon={<CheckCircleOutlined />}
                      disabled
                      style={{
                        fontSize: 12,
                        color: "#52c41a",
                        cursor: "default",
                        backgroundColor: "rgba(82, 196, 26, 0.1)",
                        borderRadius: 6,
                        border: "none",
                      }}
                    >
                      Saved
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      icon={
                        actionLoading === art.id ? (
                          <LoadingOutlined />
                        ) : (
                          <SaveOutlined />
                        )
                      }
                      disabled={actionLoading === art.id}
                      onClick={() => handleAddToBankSoalSingle(art)}
                      style={{
                        fontSize: 12,
                        color: "#fff",
                        backgroundColor: "#8C59F1", // Use theme color for action
                        borderRadius: 6,
                        border: "none",
                        boxShadow: "0 2px 4px rgba(140, 89, 241, 0.2)",
                      }}
                    >
                      {actionLoading === art.id ? "Saving..." : "Save"}
                    </Button>
                  )}

                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteArtifact(art.id)}
                    style={{
                      fontSize: 12,
                      backgroundColor: "#fff1f0",
                      borderRadius: 6,
                    }}
                  />
                </div>
              </div>
            ))}
            {artifacts.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#999",
                  marginTop: 60,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InboxOutlined style={{ fontSize: 24, color: "#ccc" }} />
                </div>
                <span>Belum ada item yang digenerate.</span>
              </div>
            )}
          </div>
        </Drawer>
      </div>
    </div>
  );
};

export default AIChatView;
