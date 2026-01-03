import { useEffect, useState } from "react";
// Remove Duplicate useState import if any.
import {
  Row,
  Col,
  Card,
  Input,
  Typography,
  Select,
  Tag,
  Spin,
  Empty,
  Radio,
  Divider,
  Button,
} from "antd";
import {
  BookOutlined,
  QuestionCircleOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import useFetchList from "../../hooks/useFetchList";
import { QuestionProps } from "../../types/question";
import ModalUpdateBankSoal from "./ModalUpdateBankSoal";
import { BankSoalResponse } from "../../types/ai.type";

const { Title, Text } = Typography;
const { Search } = Input;

const QUESTION_TYPES = [
  { value: "", label: "Semua Jenis" },
  { value: "kpu", label: "Penalaran Umum (KPU)" },
  { value: "ppu", label: "Pengetahuan dan Pemahaman Umum (PPU)" },
  { value: "pbm", label: "Pemahaman Bacaan dan Menulis (PBM)" },
  { value: "pku", label: "Pengetahuan Kuantitatif (PKU)" },
  { value: "ind", label: "Literasi Bahasa Indonesia (IND)" },
  { value: "ing", label: "Literasi Bahasa Inggris (ING)" },
  { value: "mtk", label: "Penalaran Matematika (MTK)" },
];

const getQuestionTypeName = (code: string) => {
  const type = QUESTION_TYPES.find((t) => t.value === code);
  return type ? type.label : code.toUpperCase();
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    kpu: "blue",
    ppu: "green",
    pbm: "purple",
    pku: "orange",
    ind: "red",
    ing: "cyan",
    mtk: "magenta",
  };
  return colors[type] || "default";
};

const BankSoalScreen = () => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingQuestion, setCurrentEditingQuestion] =
    useState<BankSoalResponse | null>(null);

  const {
    data: questions,
    setSearch,
    isLoading,
  } = useFetchList<QuestionProps>({
    endpoint: "bank-soal",
  });

  useEffect(() => {
    document.title = "Bank Soal - CMS";
  }, []);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedType && q.type !== selectedType) return false;
    return true;
  });

  const toggleAnswer = (questionId: string) => {
    setShowAnswer((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header Section */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <Title level={2}>
          <BookOutlined style={{ marginRight: 12, color: "#1890ff" }} />
          Bank Soal
        </Title>
      </div>

      {/* Filter Section */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Search
              placeholder="Cari soal berdasarkan kata kunci..."
              enterButton="Cari"
              size="large"
              onSearch={(value) => setSearch(value)}
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
          <Col xs={24} md={12}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FilterOutlined style={{ color: "#1890ff" }} />
              <Text strong>Jenis Soal:</Text>
              <Select
                style={{ flex: 1 }}
                size="large"
                value={selectedType}
                onChange={handleTypeChange}
                options={QUESTION_TYPES}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Questions List */}
      {isLoading ? (
        <div style={{ textAlign: "center", marginTop: 100 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>
            <Text type="secondary">Memuat bank soal...</Text>
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 100 }}>
          <Empty
            description="Tidak ada soal yang ditemukan. Coba kata kunci atau filter lain."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredQuestions.map((question, index) => (
            <Card
              key={question.question_id}
              hoverable
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border:
                  expandedQuestion === question.question_id
                    ? "2px solid #1890ff"
                    : "1px solid #f0f0f0",
                position: "relative",
              }}
              onClick={() =>
                setExpandedQuestion(
                  expandedQuestion === question.question_id
                    ? null
                    : question.question_id
                )
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                  paddingRight: 40, // Space for Edit button
                }}
              >
                <div>
                  <Tag color={getTypeColor(question.type)}>
                    {getQuestionTypeName(question.type)}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{index + 1}
                  </Text>
                </div>
              </div>

              <div style={{ position: "absolute", top: 12, right: 12 }}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Type casting QuestionProps -> any -> BankSoalResponse
                    setCurrentEditingQuestion(question as any);
                    setIsEditModalOpen(true);
                  }}
                />
              </div>

              <Title level={5} style={{ marginBottom: 16 }}>
                {question.text}
              </Title>

              {question.image_url && (
                <div style={{ marginBottom: 16, textAlign: "center" }}>
                  <img
                    src={question.image_url}
                    alt="Question"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      borderRadius: 8,
                    }}
                  />
                </div>
              )}

              {question.options && question.options.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Radio.Group
                    style={{ width: "100%" }}
                    value={
                      showAnswer[question.question_id]
                        ? question.correct_answer
                        : null
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {question.options.map((option, optIndex) => {
                        const optionLetter = String.fromCharCode(65 + optIndex);
                        const isCorrect =
                          question.correct_answer === optionLetter ||
                          option.startsWith(question.correct_answer);
                        const shouldHighlight =
                          showAnswer[question.question_id] && isCorrect;

                        return (
                          <div
                            key={optIndex}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              backgroundColor: shouldHighlight
                                ? "#f6ffed"
                                : "#fafafa",
                              border: shouldHighlight
                                ? "1px solid #52c41a"
                                : "1px solid #e8e8e8",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Radio value={optionLetter} disabled>
                              {option}
                            </Radio>
                            {shouldHighlight && (
                              <CheckCircleOutlined
                                style={{ color: "#52c41a" }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Radio.Group>
                </div>
              )}

              <Divider style={{ margin: "12px 0" }} />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAnswer(question.question_id);
                  }}
                >
                  {showAnswer[question.question_id] ? (
                    <span style={{ color: "#52c41a", cursor: "pointer" }}>
                      <CheckCircleOutlined /> Sembunyikan Jawaban
                    </span>
                  ) : (
                    <span style={{ color: "#1890ff", cursor: "pointer" }}>
                      👁 Lihat Jawaban
                    </span>
                  )}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && currentEditingQuestion && (
        <ModalUpdateBankSoal
          isModalOpen={isEditModalOpen}
          setIsModalOpen={setIsEditModalOpen}
          questionData={currentEditingQuestion}
          onSuccess={() => {
            // Reload page to reflect changes
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default BankSoalScreen;
