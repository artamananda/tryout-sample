import React, { useEffect, useState, useMemo } from "react";
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
  Pagination,
  Dropdown,
  message,
} from "antd";
import type { MenuProps } from "antd";
import {
  BookOutlined,
  QuestionCircleOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ThunderboltOutlined,
  DownOutlined,
} from "@ant-design/icons";
import useFetchList from "../../hooks/useFetchList";
import { QuestionProps } from "../../types/question";
import ModalUpdateBankSoal from "./ModalUpdateBankSoal";
import ModalCreateBankSoal from "./ModalCreateBankSoal";
import { BankSoalResponse } from "../../types/ai.type";
import {
  getCustomTypes,
  KNOWN_TYPE_LABELS,
  UTBK_QUESTION_TYPES,
  SKD_QUESTION_TYPES,
  UTBK_TYPE_CODES,
  SKD_TYPE_CODES,
  getQuestionTypeName,
} from "./questionTypes";
import { apiTriggerGenerate } from "../../api/admin";

const { Title, Text } = Typography;
const { Search } = Input;

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    kpu: "blue", ppu: "green", pbm: "purple",
    pku: "orange", ind: "red", ing: "cyan", mtk: "magenta",
    twk: "gold", tiu: "geekblue", tkp: "lime",
  };
  return colors[type] || "default";
};

interface BankSoalScreenProps {
  category?: "utbk" | "skd";
}

const BankSoalScreen = ({ category }: BankSoalScreenProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingQuestion, setCurrentEditingQuestion] =
    useState<BankSoalResponse | null>(null);

  // Create State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Generate State
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const {
    data: questions,
    setSearch,
    isLoading,
    setQuery,
  } = useFetchList<BankSoalResponse>({
    endpoint: "bank-soal",
    initialQuery: category ? { category } : {},
  });

  const pageTitle = category === "skd"
    ? "Bank Soal SKD CPNS"
    : category === "utbk"
    ? "Bank Soal UTBK"
    : "Bank Soal";

  useEffect(() => {
    document.title = `${pageTitle} - CMS`;
    // Update query so useFetchList re-fetches with the correct category
    setQuery((prev: any) => ({ ...prev, category: category || "", offset: 0 }));
    setSelectedType("");
  }, [category]);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const handleGenerate = async (typeCode: string) => {
    setGeneratingType(typeCode);
    const result = await apiTriggerGenerate(typeCode, 5);
    setGeneratingType(null);
    if (result) {
      message.success(`Berhasil generate ${result.saved} soal untuk ${getQuestionTypeName(typeCode)}`);
      window.location.reload();
    }
  };

  const generateMenuItems: MenuProps["items"] = (
    category === "skd" ? SKD_QUESTION_TYPES : UTBK_QUESTION_TYPES
  ).map(({ value, label }) => ({
    key: value,
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Tag color={getTypeColor(value)} style={{ margin: 0, fontSize: 11 }}>
          {value.toUpperCase()}
        </Tag>
        <span style={{ fontSize: 13 }}>{label}</span>
        {generatingType === value && (
          <Spin size="small" style={{ marginLeft: "auto" }} />
        )}
      </div>
    ),
    onClick: () => handleGenerate(value),
    disabled: generatingType !== null,
  }));

  // Filters & Pagination
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Build dynamic filter options scoped to the current category
  const dynamicFilterOptions = useMemo(() => {
    const relevantTypes = category === "skd"
      ? SKD_QUESTION_TYPES
      : category === "utbk"
      ? UTBK_QUESTION_TYPES
      : Object.entries(KNOWN_TYPE_LABELS).map(([value, label]) => ({ value, label }));

    const options = [{ value: "", label: "Semua Jenis" }];
    relevantTypes.forEach(({ value, label }) => {
      options.push({ value, label });
    });
    return options;
  }, [category]);

  const filteredQuestions = questions
    .filter((q) => {
      const matchType = selectedType ? q.type === selectedType : true;
      const matchText = q.text.toLowerCase().includes(searchText.toLowerCase());
      return matchType && matchText;
    })
    .sort((a: any, b: any) => {
      // Using any casting safely if created_at missing, default to 0
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      if (sortBy === "newest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      return 0;
    });

  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggleAnswer = (questionId: string) => {
    setShowAnswer((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  return (
    <div
      style={{
        padding: "20px 0",
        minHeight: "100vh",
        background: "#f8f9fa",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ width: "100%", padding: "0 16px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <Title
              level={2}
              style={{ margin: 0, color: "#1f1f1f", fontWeight: 700 }}
            >
              {pageTitle}
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {category === "skd"
                ? "Kelola soal SKD CPNS (TWK, TIU, TKP)"
                : category === "utbk"
                ? "Kelola soal UTBK (KPU, PPU, PBM, PKU, IND, ING, MTK)"
                : "Manage and organize your question repository"}
            </Text>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Dropdown
              menu={{ items: generateMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                size="large"
                loading={generatingType !== null}
                style={{
                  border: "1.5px solid #8C59F1",
                  color: "#8C59F1",
                  fontWeight: 600,
                  borderRadius: 12,
                  height: 48,
                  padding: "0 20px",
                }}
                icon={<ThunderboltOutlined />}
              >
                Generate Soal <DownOutlined style={{ fontSize: 11 }} />
              </Button>
            </Dropdown>
            <Button
              type="primary"
              size="large"
              style={{
                background: "linear-gradient(135deg, #8C59F1 0%, #9e73f8 100%)",
                border: "none",
                boxShadow: "0 4px 14px rgba(140, 89, 241, 0.3)",
                fontWeight: 600,
                borderRadius: 12,
                height: 48,
                padding: "0 24px",
              }}
              icon={<CheckCircleOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Add New Question
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <Card
          bordered={false}
          bodyStyle={{ padding: "24px 32px" }}
          style={{
            marginBottom: 24,
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            background: "#fff",
          }}
        >
          <Row gutter={24} align="middle">
            <Col flex={1}>
              <Input
                placeholder="Search questions..."
                prefix={
                  <FilterOutlined style={{ color: "#ccc", fontSize: 18 }} />
                }
                size="large"
                style={{
                  borderRadius: 12,
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #eee",
                }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col>
              <Select
                placeholder="Filter Type"
                size="large"
                allowClear
                style={{ width: 240 }}
                value={selectedType}
                onChange={setSelectedType}
                options={dynamicFilterOptions}
                className="custom-select"
              />
            </Col>
            <Col>
              <Select
                placeholder="Sort By"
                size="large"
                style={{ width: 180 }}
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { label: "Newest First", value: "newest" },
                  { label: "Oldest First", value: "oldest" },
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Spin
              size="large"
              indicator={
                <div style={{ fontSize: 40, color: "#8C59F1" }}>⚡</div>
              }
            />
            <div style={{ marginTop: 24, color: "#999", fontWeight: 500 }}>
              Loading questions...
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {paginatedQuestions.map((q) => (
                <Card
                  key={q.bank_soal_id}
                  bordered={false}
                  hoverable
                  style={{
                    borderRadius: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                    border: "1px solid #f0f0f0",
                    transition: "all 0.2s ease",
                  }}
                  bodyStyle={{ padding: "24px" }}
                  onClick={() => {
                    if (expandedQuestion === q.bank_soal_id)
                      setExpandedQuestion(null);
                    else setExpandedQuestion(q.bank_soal_id);
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 20,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "#f9f0ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8C59F1",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      <QuestionCircleOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Tag
                            color="purple"
                            style={{
                              border: "none",
                              background: "#f0e6ff",
                              color: "#8C59F1",
                              fontWeight: 600,
                              borderRadius: 6,
                              padding: "2px 10px",
                            }}
                          >
                            {getQuestionTypeName(q.type)}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            ID: {(q.bank_soal_id || "").substring(0, 8)}...
                          </Text>
                        </div>
                        <Button
                          icon={<EditOutlined />}
                          shape="circle"
                          size="large"
                          style={{ color: "#666", border: "1px solid #eee" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentEditingQuestion(q as any);
                            setIsEditModalOpen(true);
                          }}
                        />
                      </div>

                      <Typography.Paragraph
                        ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: "#222",
                          marginBottom: 16,
                          lineHeight: 1.6,
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: q.text }} />
                      </Typography.Paragraph>

                      {/* Options Preview */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                          background: "#fafafa",
                          padding: 16,
                          borderRadius: 12,
                        }}
                      >
                        <div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 12,
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            CORRECT ANSWER
                          </Text>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#52c41a",
                              fontSize: 15,
                            }}
                          >
                            {q.correct_answer}
                          </div>
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 12,
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            OPTIONS
                          </Text>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#444",
                              fontSize: 15,
                            }}
                          >
                            {Array.isArray(q.options) ? q.options.length : 0}{" "}
                            Choices
                          </div>
                        </div>
                      </div>

                      {/* Expansion for full details */}
                      {expandedQuestion === q.bank_soal_id && (
                        <div
                          style={{
                            marginTop: 24,
                            borderTop: "1px solid #eee",
                            paddingTop: 16,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              fontSize: 14,
                              color: "#999",
                              marginBottom: 12,
                            }}
                          >
                            FULL PREVIEW
                          </Title>
                          {q.image_url && (
                            <img
                              src={q.image_url}
                              alt="Q"
                              style={{
                                maxWidth: "100%",
                                borderRadius: 8,
                                marginBottom: 16,
                              }}
                            />
                          )}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {q.options?.map((opt: string, i: number) => {
                              const char = String.fromCharCode(65 + i);
                              const normalizedCorrect = String(
                                q.correct_answer || "",
                              )
                                .trim()
                                .toLowerCase();
                              const normalizedOption = String(opt || "")
                                .trim()
                                .toLowerCase();
                              const isLegacyLabel =
                                normalizedCorrect.length === 1 &&
                                normalizedCorrect === char.toLowerCase();
                              const isCor =
                                normalizedOption === normalizedCorrect ||
                                isLegacyLabel;
                              return (
                                <div
                                  key={i}
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    background: isCor ? "#f6ffed" : "#fff",
                                    border: isCor
                                      ? "1px solid #b7eb8f"
                                      : "1px solid #eee",
                                    display: "flex",
                                    gap: 12,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: isCor ? "#52c41a" : "#666",
                                    }}
                                  >
                                    {char}.
                                  </span>
                                  <span style={{ color: "#333" }}>
                                    {opt.replace(/^[A-E]\.\s*/, "")}
                                  </span>
                                  {isCor && (
                                    <CheckCircleOutlined
                                      style={{
                                        color: "#52c41a",
                                        marginLeft: "auto",
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Pembahasan / Explanation */}
                          {q.explanation && (
                            <div
                              style={{
                                marginTop: 20,
                                padding: 16,
                                background: "#fff9e6",
                                borderRadius: 12,
                                border: "1px solid #ffe58f",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 12,
                                  display: "block",
                                  marginBottom: 8,
                                  fontWeight: 600,
                                  color: "#d48806",
                                }}
                              >
                                💡 PEMBAHASAN
                              </Text>
                              <div
                                style={{ color: "#444", lineHeight: 1.6 }}
                                dangerouslySetInnerHTML={{
                                  __html: q.explanation,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredQuestions.length === 0 && (
                <div
                  style={{
                    padding: 60,
                    textAlign: "center",
                    background: "#fff",
                    borderRadius: 20,
                  }}
                >
                  <Empty description="No questions found matching your filters" />
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredQuestions.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 40,
                  paddingBottom: 40,
                }}
              >
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredQuestions.length}
                  onChange={setCurrentPage}
                  showSizeChanger
                  onShowSizeChange={(_, size) => setPageSize(size)}
                  showTotal={(total) => `Total ${total} questions`}
                />
              </div>
            )}
          </>
        )}
      </div>

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

      {/* Create Modal */}
      <ModalCreateBankSoal
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        category={category}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default BankSoalScreen;
