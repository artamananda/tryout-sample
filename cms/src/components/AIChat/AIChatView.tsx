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
  Divider,
  Pagination,
  Empty,
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
  SearchOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
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
  apiGetBankSoalTypes,
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
import {
  getQuestionTypeName as getTypeName,
  KNOWN_TYPE_LABELS,
  formatTypeOptions,
  saveCustomType,
} from "../../screens/BankSoal/questionTypes";

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

// Removed Hardcoded QUESTION_TYPES

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
    new Set(),
  );
  const [saveToBankSoal, setSaveToBankSoal] = useState(true);
  const [pendingQuestions, setPendingQuestions] = useState<GeneratedQuestion[]>(
    [],
  );
  const [topic, setTopic] = useState("");
  const [activeQuestionType, setActiveQuestionType] = useState(
    initialQuestionType || "kpu",
  );
  const [availableTypes, setAvailableTypes] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const loadTypes = async () => {
      const rawTypes = await apiGetBankSoalTypes();
      const options = formatTypeOptions(rawTypes);
      setAvailableTypes(options);
    };
    loadTypes();
  }, []);

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
  const [newTypeName, setNewTypeName] = useState("");
  const [diffDistribution, setDiffDistribution] = useState<{
    easy: number;
    medium: number;
    hard: number;
  }>({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  const updateDiffCount = (
    diff: keyof typeof diffDistribution,
    delta: number,
  ) => {
    setDiffDistribution((prev) => ({
      ...prev,
      [diff]: Math.max(0, prev[diff] + delta),
    }));
  };

  // File Context State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContext, setFileContext] = useState<{
    text: string;
    name: string;
  } | null>(null);

  // Refine State
  const [isRefineModalVisible, setIsRefineModalVisible] = useState(false);
  // Session History Filters
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionSort, setSessionSort] = useState("newest");
  const [sessionPage, setSessionPage] = useState(1);
  const SESSION_PAGE_SIZE = 5;

  const filteredSessions = history
    .filter((h) =>
      (h.topic || "").toLowerCase().includes(sessionSearch.toLowerCase()),
    )
    .sort((a, b) => {
      if (sessionSort === "newest")
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      if (sessionSort === "oldest")
        return (
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        );
      return 0;
    });

  const paginatedSessions = filteredSessions.slice(
    (sessionPage - 1) * SESSION_PAGE_SIZE,
    sessionPage * SESSION_PAGE_SIZE,
  );

  const [refineArtifactId, setRefineArtifactId] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);

  // Loading Progress State
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop loading timer
  useEffect(() => {
    if (loading) {
      setLoadingElapsed(0);
      loadingTimerRef.current = setInterval(() => {
        setLoadingElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setLoadingElapsed(0);
      setLoadingStep("");
    }
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [loading]);

  // Update loading step messages based on elapsed time
  useEffect(() => {
    if (!loading) return;
    if (loadingElapsed < 3) {
      setLoadingStep("Mengirim permintaan ke AI...");
    } else if (loadingElapsed < 8) {
      setLoadingStep("AI sedang menganalisis dan membuat soal...");
    } else if (loadingElapsed < 15) {
      setLoadingStep("Masih memproses... soal sedang disusun...");
    } else if (loadingElapsed < 25) {
      setLoadingStep("Hampir selesai... menyempurnakan hasil...");
    } else {
      setLoadingStep("Proses memakan waktu lebih lama dari biasa...");
    }
  }, [loadingElapsed, loading]);

  // Edit Artifact State
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] =
    useState<string>("multiple_choice");

  // Review Drawer State (Pending or Checkpoint)
  const [reviewDrawer, setReviewDrawer] = useState<{
    visible: boolean;
    mode: "pending" | "checkpoint";
    title: string;
    data: GeneratedQuestion[]; // Normalized data
    originalArtifacts?: ChatArtifact[]; // For checkpoint references
  }>({
    visible: false,
    mode: "pending",
    title: "",
    data: [],
  });

  // History Filters
  // Artifact Drawer Filters & Pagination
  const [artifactSearch, setArtifactSearch] = useState("");
  const [artifactSort, setArtifactSort] = useState("newest");
  const [artifactFilter, setArtifactFilter] = useState("all");
  const [artifactPage, setArtifactPage] = useState(1);
  const ARTIFACT_PAGE_SIZE = 5;

  const filteredArtifacts = artifacts
    .filter((art) => {
      const matchesSearch = art.content.text
        .toLowerCase()
        .includes(artifactSearch.toLowerCase());
      const matchesFilter =
        artifactFilter === "all" ? true : art.status === artifactFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (artifactSort === "newest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (artifactSort === "oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      return 0;
    });

  const paginatedArtifacts = filteredArtifacts.slice(
    (artifactPage - 1) * ARTIFACT_PAGE_SIZE,
    artifactPage * ARTIFACT_PAGE_SIZE,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadHistory();
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Halo! Saya AI Assistant pembuat soal UTBK. 🎓\n\n**Apa yang bisa saya lakukan:**\n1. 💬 **Ngobrol** - Diskusikan topik dan strategi soal\n2. 📝 **Generate Soal** - Ketik "buat soal tentang [topik]"\n3. ✨ **Refine** - Perbaiki soal yang sudah dibuat\n\n**💡 Tips:** Pilih jenis soal & format di toolbar bawah, lalu ketik topik yang diinginkan.\n**🔄 Auto-Generate:** Sistem otomatis membuat soal UTBK setiap 10 menit untuk semua jenis soal secara terus-menerus.\n\nSilakan mulai!`,
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
        artifact_ids: m.artifact_ids, // Preserve artifact_ids for checkpoint buttons
      }));
      setMessages(converted);
      // If we have question types in history, set it?
      if (session.question_type) setActiveQuestionType(session.question_type);
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
        content: `Halo! Saya AI Assistant pembuat soal UTBK. 🎓\n\n**Apa yang bisa saya lakukan:**\n1. 💬 **Ngobrol** - Diskusikan topik dan strategi soal\n2. 📝 **Generate Soal** - Ketik "buat soal tentang [topik]"\n3. ✨ **Refine** - Perbaiki soal yang sudah dibuat\n\n**💡 Tips:** Pilih jenis soal & format di toolbar bawah, lalu ketik topik yang diinginkan.\n**🔄 Auto-Generate:** Sistem otomatis membuat soal UTBK setiap 10 menit untuk semua jenis soal secara terus-menerus.\n\nSilakan mulai!`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleEditSession = (
    e: React.MouseEvent,
    id: string,
    currentTitle: string,
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
        message.success("Soal berhasil diperbarui");
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
      message.success("Prompt berhasil disimpan ke dataset");
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
      refineInstruction,
    );
    setRefineLoading(false);
    if (updated) {
      message.success("Soal berhasil disempurnakan oleh AI");
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
      title: "Hapus Soal",
      content: "Apakah Anda yakin ingin menghapus soal ini?",
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async () => {
        const success = await apiDeleteArtifact(id);
        if (success) {
          message.success("Berhasil dihapus");
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
      message.success("Berhasil disimpan ke Bank Soal");
      // Refresh
      const arts = await apiGetSessionArtifacts(sessionId);
      if (arts) setArtifacts(arts);
    }
    setActionLoading(null);
  };

  const getQuestionTypeName = (code: string) => {
    return getTypeName(code);
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
          setReviewDrawer({
            visible: true,
            mode: "pending",
            title: "Review Soal",
            data: response.questions,
          });
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
      message.error(
        "Gagal berkomunikasi dengan AI. Silakan coba lagi dalam beberapa saat.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGenerate = async () => {
    const parts: string[] = [];
    if (diffDistribution.easy > 0)
      parts.push(`${diffDistribution.easy} soal mudah`);
    if (diffDistribution.medium > 0)
      parts.push(`${diffDistribution.medium} soal sedang`);
    if (diffDistribution.hard > 0)
      parts.push(`${diffDistribution.hard} soal sulit`);

    if (parts.length === 0) {
      message.warning("Pilih jumlah soal yang ingin digenerate");
      return;
    }

    const diffPrompt = parts.join(" dan ");
    const topicText = topic.trim() || "...";

    setInputValue(
      `Buat ${diffPrompt} tentang ${topicText} untuk ${getQuestionTypeName(
        activeQuestionType,
      )}`,
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
        message.success(
          "✅ Percakapan disimpan! Soal akan diekstrak otomatis oleh sistem (cron job jam 01:00 WIB). Soal yang diekstrak akan muncul di Bank Soal dengan status Draft.",
        );
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
        selectedQuestions.has(i),
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
        `Tersimpan: ${savedToTryout} Tryout, ${savedToBank} Bank Soal`,
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
              {/* Sidebar Filters */}
              <div
                style={{
                  padding: "0 4px 8px 4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Input
                  placeholder="Cari..."
                  prefix={<SearchOutlined style={{ color: "#ccc" }} />}
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  size="small"
                  allowClear
                />
                <Select
                  value={sessionSort}
                  onChange={setSessionSort}
                  size="small"
                  options={[
                    { label: "Terbaru", value: "newest" },
                    { label: "Terlama", value: "oldest" },
                  ]}
                  style={{ width: "100%" }}
                />
              </div>

              {paginatedSessions.map((item) => (
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
                            },
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

              {/* Session Pagination */}
              {filteredSessions.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 12,
                    paddingBottom: 12,
                  }}
                >
                  <Pagination
                    current={sessionPage}
                    pageSize={SESSION_PAGE_SIZE}
                    total={filteredSessions.length}
                    onChange={setSessionPage}
                    size="small"
                  />
                </div>
              )}

              {filteredSessions.length === 0 && (
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
                value={activeQuestionType}
                onChange={setActiveQuestionType}
                options={availableTypes}
                style={{ width: 280 }}
                size="large"
                variant="borderless"
                showSearch
                placeholder="Pilih jenis soal"
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                suffixIcon={<PlusOutlined style={{ color: "#8C59F1" }} />}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <div style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Input
                          placeholder="Tambah jenis baru..."
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          size="small"
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={!newTypeName.trim()}
                          onClick={() => {
                            const trimmed = newTypeName.trim();
                            if (trimmed) {
                              import("../../screens/BankSoal/questionTypes").then(
                                (m) => {
                                  m.saveCustomType(trimmed);
                                  const newOptions = m.formatTypeOptions(
                                    availableTypes.map((t) => t.value),
                                  );
                                  setAvailableTypes(newOptions);
                                  setActiveQuestionType(trimmed);
                                  setNewTypeName("");
                                  message.success(
                                    `Jenis soal "${trimmed}" ditambahkan!`,
                                  );
                                },
                              );
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                listHeight={300}
              />
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {pendingQuestions.length > 0 && (
              <Button
                type={
                  reviewDrawer.visible && reviewDrawer.mode === "pending"
                    ? "primary"
                    : "default"
                }
                onClick={() =>
                  setReviewDrawer({
                    visible: true,
                    mode: "pending",
                    title: "Review Soal",
                    data: pendingQuestions,
                  })
                }
                icon={<CheckCircleOutlined />}
              >
                Review ({pendingQuestions.length})
              </Button>
            )}
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setIsArtifactDrawerVisible(true)}
            >
              Riwayat Generasi
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
                      <HistoryOutlined /> Soal Tersimpan (Checkpoint)
                    </div>
                    <Button
                      type="dashed"
                      style={{
                        borderColor: "#b37feb",
                        color: "#b37feb",
                        backgroundColor: "#f9f0ff",
                      }}
                      icon={<HistoryOutlined />}
                      onClick={async () => {
                        // Fetch artifacts for this session when button is clicked
                        let checkpointData: ChatArtifact[] = [];
                        if (
                          sessionId &&
                          msg.artifact_ids &&
                          msg.artifact_ids.length > 0
                        ) {
                          const allArtifacts =
                            await apiGetSessionArtifacts(sessionId);
                          if (allArtifacts) {
                            checkpointData = allArtifacts.filter((art) =>
                              msg.artifact_ids?.includes(art.id),
                            );
                          }
                        }
                        // Map to GeneratedQuestion-like for display
                        const normalized = checkpointData.map((art) => ({
                          text: art.content.text,
                          options: art.content.options || [],
                          correct_answer: art.content.correct_answer,
                          explanation: art.content.explanation,
                          type: art.content.type,
                          metadata: art.metadata,
                        }));
                        setReviewDrawer({
                          visible: true,
                          mode: "checkpoint",
                          title: "Review Checkpoint Soal",
                          data: normalized as GeneratedQuestion[],
                          originalArtifacts: checkpointData,
                        });
                      }}
                    >
                      Lihat {msg.artifact_ids.length} Soal Tersimpan
                    </Button>
                  </div>
                ) : (
                  msg.questions &&
                  msg.questions.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Button
                        type="dashed"
                        style={{
                          borderColor: "#8C59F1",
                          color: "#8C59F1",
                          backgroundColor: "#f9f0ff",
                        }}
                        icon={<QuestionCircleOutlined />}
                        onClick={() => {
                          setPendingQuestions(msg.questions || []);
                          setReviewDrawer({
                            visible: true,
                            mode: "pending",
                            title: "Review Soal",
                            data: msg.questions || [],
                          });
                        }}
                      >
                        Lihat {msg.questions.length} Soal Hasil Generate
                      </Button>
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
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                marginLeft: 8,
                padding: "16px 20px",
                backgroundColor: "white",
                borderRadius: "20px 20px 20px 4px",
                border: "1px solid #f0e6ff",
                boxShadow: "0 4px 12px rgba(140, 89, 241, 0.08)",
                maxWidth: "75%",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #8C59F1 0%, #b37feb 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                >
                  <RobotOutlined style={{ color: "white", fontSize: 18 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 14, color: "#333" }}>
                    AI sedang bekerja
                  </Text>
                  <div style={{ fontSize: 11, color: "#999" }}>
                    {loadingElapsed}s berlalu
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div style={{ width: "100%", marginBottom: 8 }}>
                <div
                  style={{
                    height: 3,
                    backgroundColor: "#f0e6ff",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #8C59F1, #b37feb, #8C59F1)",
                      borderRadius: 2,
                      animation: "shimmer 2s ease-in-out infinite",
                      width:
                        loadingElapsed < 8
                          ? "40%"
                          : loadingElapsed < 15
                            ? "65%"
                            : loadingElapsed < 25
                              ? "85%"
                              : "95%",
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>

              <Text
                style={{
                  fontSize: 13,
                  color: "#8C59F1",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <LoadingOutlined spin style={{ fontSize: 14 }} />
                {loadingStep}
              </Text>

              {loadingElapsed >= 15 && (
                <Text
                  type="secondary"
                  style={{ fontSize: 11, marginTop: 4, fontStyle: "italic" }}
                >
                  💡 Pembuatan soal berkualitas membutuhkan waktu. AI sedang
                  menyusun soal yang setara UTBK.
                </Text>
              )}
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
              title="Simpan percakapan ini agar soal diekstrak otomatis oleh sistem di latar belakang (cron job berjalan setiap jam 01:00 WIB)"
            >
              {savingLog ? (
                <>
                  <LoadingOutlined spin style={{ marginRight: 4 }} />{" "}
                  Menyimpan...
                </>
              ) : (
                "📋 Simpan & Ekstrak Otomatis"
              )}
            </Tag>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Select
                value={activeQuestionType}
                onChange={(val) => setActiveQuestionType(val)}
                style={{ minWidth: 200, color: "#8C59F1", fontWeight: 600 }}
                bordered={false}
                options={availableTypes}
                showSearch
                placeholder="Jenis Soal"
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <div style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Input
                          placeholder="Tambah jenis..."
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          size="small"
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={!newTypeName.trim()}
                          onClick={() => {
                            const trimmed = newTypeName.trim();
                            if (trimmed) {
                              import("../../screens/BankSoal/questionTypes").then(
                                (m) => {
                                  m.saveCustomType(trimmed);
                                  const newOptions = m.formatTypeOptions(
                                    availableTypes.map((t) => t.value),
                                  );
                                  setAvailableTypes(newOptions);
                                  setActiveQuestionType(trimmed);
                                  setNewTypeName("");
                                  message.success(
                                    `Jenis soal "${trimmed}" ditambahkan!`,
                                  );
                                },
                              );
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              />
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
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {[
                  { label: "Mudah", key: "easy" as const },
                  { label: "Sedang", key: "medium" as const },
                  { label: "Sulit", key: "hard" as const },
                ].map((diff) => (
                  <div
                    key={diff.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor:
                        diffDistribution[diff.key] > 0 ? "#f9f0ff" : "#fff",
                      border:
                        diffDistribution[diff.key] > 0
                          ? "1px solid #d3adf7"
                          : "1px solid #d9d9d9",
                      borderRadius: 16,
                      padding: "2px 4px",
                      transition: "all 0.3s ease",
                      boxShadow:
                        diffDistribution[diff.key] > 0
                          ? "0 2px 4px rgba(140, 89, 241, 0.1)"
                          : "none",
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={
                        <MinusCircleOutlined
                          style={{
                            fontSize: 14,
                            color:
                              diffDistribution[diff.key] > 0
                                ? "#8C59F1"
                                : "#ccc",
                          }}
                        />
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDiffCount(diff.key, -1);
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      disabled={diffDistribution[diff.key] <= 0}
                    />
                    <span
                      style={{
                        padding: "0 4px",
                        fontWeight: 600,
                        fontSize: 12,
                        color:
                          diffDistribution[diff.key] > 0
                            ? "#8C59F1"
                            : "#bfbfbf",
                        minWidth: 65,
                        textAlign: "center",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      onClick={() => updateDiffCount(diff.key, 1)}
                    >
                      {diffDistribution[diff.key]} {diff.label}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={
                        <PlusCircleOutlined
                          style={{
                            fontSize: 14,
                            color: "#8C59F1",
                          }}
                        />
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDiffCount(diff.key, 1);
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  </div>
                ))}

                {(diffDistribution.easy > 0 ||
                  diffDistribution.medium > 0 ||
                  diffDistribution.hard > 0) && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleQuickGenerate()}
                    style={{
                      borderRadius: 16,
                      backgroundColor: "#8C59F1",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 700,
                      height: 28,
                      padding: "0 14px",
                      marginLeft: 4,
                      boxShadow: "0 4px 10px rgba(140, 89, 241, 0.3)",
                    }}
                  >
                    Apply Template
                  </Button>
                )}
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
                    message.success("File konteks berhasil dimuat");
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
              placeholder={
                loading
                  ? "⏳ AI sedang memproses permintaan Anda..."
                  : "Ketik pesan atau topik soal... (contoh: buat 5 soal tentang Teorema Pythagoras)"
              }
              autoSize={{ minRows: 1, maxRows: 6 }}
              bordered={false}
              style={{
                flex: 1,
                padding: "6px 0",
                resize: "none",
                fontSize: 15,
                backgroundColor: "transparent",
                lineHeight: 1.5,
                opacity: loading ? 0.6 : 1,
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
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, #8C59F1 0%, #9e73f8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(140, 89, 241, 0.3)",
                }}
              >
                <HistoryOutlined style={{ color: "white", fontSize: 18 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 700, fontSize: 17, color: "#333" }}>
                  {reviewDrawer.title}
                </span>
                <span style={{ fontWeight: 400, fontSize: 12, color: "#999" }}>
                  {reviewDrawer.mode === "checkpoint"
                    ? "Kelola dan review soal yang tersimpan"
                    : "Pilih dan sempurnakan soal yang baru digenerate"}
                </span>
              </div>
            </div>
          }
          placement="right"
          onClose={() => setReviewDrawer({ ...reviewDrawer, visible: false })}
          open={reviewDrawer.visible}
          width={600}
          mask={true}
          maskStyle={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          zIndex={1000}
          headerStyle={{
            borderBottom: "1px solid #f0f0f0",
            padding: "20px 24px",
          }}
          bodyStyle={{ padding: "24px", backgroundColor: "#fcfaff" }} // Very light purple tint
          closeIcon={
            <div
              style={{ padding: 4, borderRadius: 6, transition: "0.2s" }}
              className="hover-bg-gray"
            />
          }
        >
          {reviewDrawer.mode === "pending" && (
            <>
              <div
                style={{
                  padding: "20px",
                  background:
                    "linear-gradient(135deg, #f6ffed 0%, #f0f9eb 100%)",
                  borderRadius: 20,
                  marginBottom: 20,
                  border: "1px solid #b7eb8f",
                  boxShadow: "0 2px 10px rgba(82, 196, 26, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Title
                    level={5}
                    style={{ margin: 0, color: "#389e0d", fontWeight: 700 }}
                  >
                    <QuestionCircleOutlined /> Generated (
                    {pendingQuestions.length})
                  </Title>
                  <Tag
                    color="success"
                    style={{
                      borderRadius: 6,
                      fontWeight: 600,
                      padding: "2px 8px",
                    }}
                  >
                    {selectedQuestions.size} Dipilih
                  </Tag>
                </div>
                <Checkbox
                  checked={saveToBankSoal}
                  onChange={(e) => setSaveToBankSoal(e.target.checked)}
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  Simpan ke Bank Soal{" "}
                  <BulbOutlined style={{ color: "#fa8c16", marginLeft: 4 }} />
                </Checkbox>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                {pendingQuestions.map((q, i) => (
                  <div
                    key={i}
                    onClick={() => toggleQuestionSelection(i)}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: "white",
                      border: selectedQuestions.has(i)
                        ? "2px solid #52c41a"
                        : "1px solid #eee",
                      boxShadow: selectedQuestions.has(i)
                        ? "0 4px 12px rgba(82, 196, 26, 0.1)"
                        : "0 2px 8px rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <Tag
                        color={selectedQuestions.has(i) ? "green" : "default"}
                        style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}
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
                        style={{
                          height: 28,
                          padding: "0 8px",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#1890ff",
                          backgroundColor: "rgba(24, 144, 255, 0.05)",
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: "1.6",
                        color: "#333",
                        fontWeight: 400,
                        marginBottom: 12,
                      }}
                    >
                      {q.text.substring(0, 180)}
                      {q.text.length > 180 ? "..." : ""}
                    </div>

                    <div
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "#f9f0ff",
                        borderRadius: 8,
                        fontSize: 11,
                        color: "#8C59F1",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #e9d5ff",
                        fontWeight: 600,
                      }}
                    >
                      <RobotOutlined style={{ fontSize: 13 }} />
                      <span>Dibuat oleh AI</span>
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
                  borderRadius: 12,
                  height: 52,
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: "0 6px 16px rgba(82, 196, 26, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                Simpan {selectedQuestions.size} Soal Pilihan
              </Button>
            </>
          )}

          {reviewDrawer.mode === "checkpoint" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reviewDrawer.data.map((q, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid #f0e6ff",
                    boxShadow: "0 4px 12px rgba(140, 89, 241, 0.05)",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 20px",
                      background:
                        "linear-gradient(90deg, #f9f0ff 0%, #ffffff 100%)",
                      borderBottom: "1px solid #f0e6ff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#8C59F1",
                        fontSize: 13,
                      }}
                    >
                      SOAL #{i + 1}
                    </span>
                    {q.type && (
                      <Tag
                        color="purple"
                        style={{
                          margin: 0,
                          borderRadius: 4,
                          textTransform: "uppercase",
                          fontSize: 10,
                        }}
                      >
                        {q.type}
                      </Tag>
                    )}
                  </div>

                  <div style={{ padding: "16px 20px" }}>
                    <div
                      style={{
                        fontSize: 15,
                        color: "#333",
                        lineHeight: "1.6",
                        marginBottom: 16,
                        fontWeight: 400,
                      }}
                    >
                      {q.text}
                    </div>

                    <div
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f9f9f9",
                        borderRadius: 12,
                        marginBottom: 16,
                        border: "1px dashed #eee",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#999",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 4,
                          fontWeight: 700,
                        }}
                      >
                        Jawaban Benar
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#52c41a",
                          fontSize: 16,
                        }}
                      >
                        {q.correct_answer}
                      </div>
                    </div>

                    {q.metadata?.source && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: "6px 12px",
                          backgroundColor:
                            q.metadata.source === "ai_generated"
                              ? "#f9f0ff"
                              : "#f5f5f5",
                          borderRadius: 10,
                          fontSize: 12,
                          color:
                            q.metadata.source === "ai_generated"
                              ? "#8C59F1"
                              : "#666",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          border:
                            q.metadata.source === "ai_generated"
                              ? "1px solid #e9d5ff"
                              : "1px solid #eee",
                          fontWeight: 500,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        }}
                      >
                        {q.metadata.source === "ai_generated" ? (
                          <>
                            <RobotOutlined style={{ fontSize: 14 }} />
                            <span>Dibuat oleh AI</span>
                          </>
                        ) : (
                          <>
                            <BookOutlined style={{ fontSize: 14 }} />
                            <span>Sumber: {q.metadata.source}</span>
                          </>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        type="primary"
                        ghost
                        size="middle"
                        icon={<EditOutlined />}
                        style={{
                          borderRadius: 10,
                          fontWeight: 600,
                          borderColor: "#8C59F1",
                          color: "#8C59F1",
                        }}
                        onClick={() => {
                          if (
                            reviewDrawer.originalArtifacts &&
                            reviewDrawer.originalArtifacts[i]
                          ) {
                            handleEditArtifact(
                              reviewDrawer.originalArtifacts[i],
                            );
                          }
                        }}
                      >
                        Edit / Lihat Detail
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Drawer>
        <ModalEditQuestion
          isModalOpen={isEditModalVisible}
          setIsModalOpen={setIsEditModalVisible}
          initialData={editingQuestionData}
          onSave={handleSaveQuestion}
          zIndex={2000}
          title={
            editingArtifactId ? "Edit Soal Hasil Generate" : "Edit Soal Pending"
          }
        />

        <Modal
          title="Simpan ke Dataset AI"
          open={isSaveExampleModalVisible}
          onOk={handleSaveExample}
          onCancel={() => setIsSaveExampleModalVisible(false)}
          zIndex={2000}
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
          title="Perbaiki Soal dengan AI"
          open={isRefineModalVisible}
          onOk={handleRefineSubmit}
          confirmLoading={refineLoading}
          okText={refineLoading ? "AI sedang memperbaiki..." : "Perbaiki Soal"}
          cancelText="Batal"
          onCancel={() => setIsRefineModalVisible(false)}
          zIndex={2000}
        >
          {refineLoading && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#f9f0ff",
                borderRadius: 12,
                marginBottom: 16,
                border: "1px solid #e9d5ff",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <LoadingOutlined
                spin
                style={{ color: "#8C59F1", fontSize: 18 }}
              />
              <div>
                <Text strong style={{ color: "#8C59F1", fontSize: 13 }}>
                  AI sedang memperbaiki soal...
                </Text>
                <div style={{ fontSize: 11, color: "#999" }}>
                  Proses ini membutuhkan waktu 10-30 detik
                </div>
              </div>
            </div>
          )}
          <Typography.Paragraph type="secondary">
            Berikan instruksi ke AI untuk memperbaiki soal ini. Contoh:
            &quot;Buat lebih mirip soal UTBK 2024&quot; atau &quot;Perbaiki
            perhitungan di penjelasan&quot;.
          </Typography.Paragraph>
          <Input.TextArea
            rows={4}
            placeholder="Contoh: Buat soal lebih sulit, perbaiki opsi jawaban agar lebih masuk akal, sesuaikan gaya soal UTBK..."
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            disabled={refineLoading}
          />
        </Modal>

        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, #8C59F1 0%, #9e73f8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(140, 89, 241, 0.3)",
                }}
              >
                <HistoryOutlined style={{ color: "white", fontSize: 18 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 700, fontSize: 17, color: "#333" }}>
                  Riwayat Generasi
                </span>
                <span style={{ fontWeight: 400, fontSize: 12, color: "#999" }}>
                  Soal yang sudah digenerate dalam sesi ini
                </span>
              </div>
            </div>
          }
          placement="right"
          onClose={() => setIsArtifactDrawerVisible(false)}
          open={isArtifactDrawerVisible}
          width={600}
          mask={true}
          maskStyle={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          zIndex={1000}
          headerStyle={{
            borderBottom: "1px solid #f0f0f0",
            padding: "20px 24px",
          }}
          bodyStyle={{ backgroundColor: "#fcfaff", padding: "24px" }}
          closeIcon={
            <div
              style={{ padding: 4, borderRadius: 6, transition: "0.2s" }}
              className="hover-bg-gray"
            />
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 24,
              backgroundColor: "white",
              padding: "16px",
              borderRadius: 20,
              border: "1px solid #f0e6ff",
              boxShadow: "0 4px 12px rgba(140, 89, 241, 0.03)",
            }}
          >
            <Input
              placeholder="Cari pertanyaan..."
              size="large"
              prefix={<SearchOutlined style={{ color: "#8C59F1" }} />}
              value={artifactSearch}
              onChange={(e) => setArtifactSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 12 }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <Select
                style={{ flex: 1 }}
                size="middle"
                value={artifactSort}
                onChange={setArtifactSort}
                options={[
                  { label: "Terbaru", value: "newest" },
                  { label: "Terlama", value: "oldest" },
                ]}
                dropdownStyle={{ borderRadius: 12 }}
              />
              <Select
                style={{ flex: 1 }}
                size="middle"
                value={artifactFilter}
                onChange={setArtifactFilter}
                options={[
                  { label: "Semua Status", value: "all" },
                  { label: "Menunggu", value: "pending" },
                  { label: "Disetujui", value: "approved" },
                  { label: "Disempurnakan", value: "refined" },
                  { label: "Diedit", value: "edited" },
                  { label: "Digenerate", value: "generated" },
                ]}
                dropdownStyle={{ borderRadius: 12 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {paginatedArtifacts.map((art, idx) => (
              <div
                key={art.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: 20,
                  border: "1px solid #f0e6ff",
                  boxShadow: "0 4px 15px rgba(140, 89, 241, 0.05)",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
              >
                {/* Header with Subtitle Styling */}
                <div
                  style={{
                    padding: "12px 20px",
                    background:
                      "linear-gradient(90deg, #f9f0ff 0%, #ffffff 100%)",
                    borderBottom: "1px solid #f0e6ff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#8C59F1",
                        fontSize: 13,
                      }}
                    >
                      ARTIFACT #
                      {(artifactPage - 1) * ARTIFACT_PAGE_SIZE + idx + 1}
                    </span>
                    <span
                      style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}
                    >
                      •{" "}
                      {new Date(art.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <Tag
                    color={art.status === "approved" ? "success" : "purple"}
                    style={{
                      margin: 0,
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      border: "none",
                      padding: "2px 8px",
                    }}
                  >
                    {art.status.toUpperCase()}
                  </Tag>
                </div>

                {/* Content Area */}
                <div style={{ padding: "20px" }}>
                  <Typography.Paragraph
                    ellipsis={{
                      rows: 4,
                      expandable: true,
                      symbol: "lihat selengkapnya",
                    }}
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#333",
                      lineHeight: "1.7",
                      fontWeight: 400,
                    }}
                  >
                    {art.content.text}
                  </Typography.Paragraph>

                  {art.metadata?.source && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "6px 12px",
                        backgroundColor:
                          art.metadata.source === "ai_generated"
                            ? "#f9f0ff"
                            : "#f5f5f5",
                        borderRadius: 10,
                        fontSize: 12,
                        color:
                          art.metadata.source === "ai_generated"
                            ? "#8C59F1"
                            : "#666",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        border:
                          art.metadata.source === "ai_generated"
                            ? "1px solid #e9d5ff"
                            : "1px solid #eee",
                        fontWeight: 500,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                    >
                      {art.metadata.source === "ai_generated" ? (
                        <>
                          <RobotOutlined style={{ fontSize: 14 }} />
                          <span>Dibuat oleh AI</span>
                        </>
                      ) : (
                        <>
                          <BookOutlined style={{ fontSize: 14 }} />
                          <span>Sumber: {art.metadata.source}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 20,
                      paddingTop: 16,
                      borderTop: "1px solid #f7f7f7",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      size="middle"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditArtifact(art)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#666",
                        backgroundColor: "#f5f5f5",
                        borderRadius: 10,
                        padding: "0 12px",
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="middle"
                      type="text"
                      icon={<RedoOutlined />}
                      onClick={() => handleOpenRefine(art.id)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#666",
                        backgroundColor: "#f5f5f5",
                        borderRadius: 10,
                        padding: "0 12px",
                      }}
                    >
                      Refine
                    </Button>

                    <div style={{ flex: 1 }} />

                    {art.status === "approved" ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          backgroundColor: "#f6ffed",
                          borderRadius: 10,
                          color: "#52c41a",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircleOutlined /> Tersimpan
                      </div>
                    ) : (
                      <Button
                        type="primary"
                        size="middle"
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
                          borderRadius: 10,
                          backgroundColor: "#8C59F1",
                          borderColor: "#8C59F1",
                          fontWeight: 700,
                          padding: "0 20px",
                          boxShadow: "0 4px 10px rgba(140, 89, 241, 0.2)",
                        }}
                      >
                        {actionLoading === art.id ? "Menyimpan..." : "Simpan"}
                      </Button>
                    )}

                    <Button
                      size="middle"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteArtifact(art.id)}
                      style={{
                        backgroundColor: "#fff1f0",
                        borderRadius: 10,
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Artifact Pagination */}
            {filteredArtifacts.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 16,
                }}
              >
                <Pagination
                  current={artifactPage}
                  pageSize={ARTIFACT_PAGE_SIZE}
                  total={filteredArtifacts.length}
                  onChange={setArtifactPage}
                  size="small"
                />
              </div>
            )}

            {filteredArtifacts.length === 0 && (
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
