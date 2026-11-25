import { useEffect, useMemo, useState } from "react";
import { Button, Card, Dropdown, Empty, Input, Pagination, Select, Skeleton, Space, Spin, Tag, Tooltip, Typography, message } from "antd";
import type { MenuProps } from "antd";
import {
  CheckCircleFilled,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useFetchList from "../../hooks/useFetchList";
import ModalUpdateBankSoal from "./ModalUpdateBankSoal";
import ModalCreateBankSoal from "./ModalCreateBankSoal";
import { BankSoalResponse } from "../../types/ai.type";
import { KNOWN_TYPE_LABELS, UTBK_QUESTION_TYPES, SKD_QUESTION_TYPES, getQuestionTypeName } from "./questionTypes";
import { apiTriggerGenerate } from "../../api/admin";
import PageHeader from "../../components/kit/PageHeader";

const { Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  kpu: "blue", ppu: "green", pbm: "purple", pku: "orange", ind: "red", ing: "cyan", mtk: "magenta",
  twk: "gold", tiu: "geekblue", tkp: "lime",
};

/** Index of the correct option: by text, or a legacy single-letter answer. */
const correctIndex = (question: BankSoalResponse) => {
  const answer = String(question.correct_answer || "").trim().toLowerCase();
  const byText = (question.options || []).findIndex((option) => String(option || "").trim().toLowerCase() === answer);
  if (byText >= 0) return byText;
  return answer.length === 1 ? answer.charCodeAt(0) - 97 : -1;
};

const stripLetter = (option: string) => String(option || "").replace(/^[A-E]\.\s*/, "");

interface BankSoalScreenProps {
  category?: "utbk" | "skd";
}

const BankSoalScreen = ({ category }: BankSoalScreenProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<BankSoalResponse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: questions, isLoading, setQuery } = useFetchList<BankSoalResponse>({
    endpoint: "bank-soal",
    initialQuery: category ? { category } : {},
  });

  const pageTitle = category === "skd" ? "Bank Soal SKD CPNS" : category === "utbk" ? "Bank Soal UTBK" : "Bank Soal";
  const typeList = category === "skd" ? SKD_QUESTION_TYPES : category === "utbk" ? UTBK_QUESTION_TYPES : [...UTBK_QUESTION_TYPES, ...SKD_QUESTION_TYPES];

  useEffect(() => {
    document.title = `${pageTitle} - CMS`;
    setQuery((prev: any) => ({ ...prev, category: category || "", offset: 0 }));
    setSelectedType("");
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => setCurrentPage(1), [selectedType, searchText, sortBy]);

  const handleGenerate = async (typeCode: string) => {
    setGeneratingType(typeCode);
    const result = await apiTriggerGenerate(typeCode, 5);
    setGeneratingType(null);
    if (result) {
      message.success(`Berhasil generate ${result.saved} soal untuk ${getQuestionTypeName(typeCode)}`);
      window.location.reload();
    }
  };

  const generateMenuItems: MenuProps["items"] = typeList.map(({ value, label }) => ({
    key: value,
    label: (
      <Space>
        <Tag color={TYPE_COLORS[value]} style={{ margin: 0 }}>
          {value.toUpperCase()}
        </Tag>
        {label}
        {generatingType === value && <Spin size="small" />}
      </Space>
    ),
    onClick: () => handleGenerate(value),
    disabled: generatingType !== null,
  }));

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((question) => {
      counts[question.type] = (counts[question.type] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return questions
      .filter((question) => (selectedType ? question.type === selectedType : true))
      .filter((question) => (search ? String(question.text || "").toLowerCase().includes(search) : true))
      .sort((a, b) => {
        const diff = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        return sortBy === "oldest" ? -diff : diff;
      });
  }, [questions, selectedType, searchText, sortBy]);

  const pageQuestions = filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderOptions = (question: BankSoalResponse) => {
    const isTKP = question.type === "tkp";
    const correct = correctIndex(question);
    const scores = question.option_scores || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(question.options || []).map((option, index) => {
          const isCorrect = !isTKP && index === correct;
          const score = isTKP ? scores[index] ?? Math.max(1, 5 - index) : undefined;
          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${isCorrect ? "#86efac" : "var(--tl-line)"}`,
                background: isCorrect ? "#f0fdf4" : "#fff",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  background: isCorrect ? "#16a34a" : "#f1f5f9",
                  color: isCorrect ? "#fff" : "#475569",
                }}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.6, color: "var(--tl-ink)" }}>{stripLetter(option)}</span>
              {isCorrect && <CheckCircleFilled style={{ color: "#16a34a", marginTop: 5 }} />}
              {score !== undefined && (
                <Tooltip title="Bobot TKP">
                  <Tag color={score >= 5 ? "green" : score >= 3 ? "gold" : "default"} style={{ margin: 0 }}>
                    {score}
                  </Tag>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tl-page">
      <PageHeader
        title={pageTitle}
        subtitle={
          category === "skd"
            ? "Kelola soal SKD CPNS: TWK, TIU, dan TKP."
            : category === "utbk"
            ? "Kelola soal UTBK: KPU, PPU, PBM, PKU, IND, ING, MTK."
            : "Kelola semua soal."
        }
        extra={
          <>
            <Dropdown menu={{ items: generateMenuItems }} trigger={["click"]} placement="bottomRight">
              <Button icon={<ThunderboltOutlined />} loading={generatingType !== null}>
                Generate Soal <DownOutlined />
              </Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
              Tambah Soal
            </Button>
          </>
        }
      />

      <Card className="tl-card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Input
            placeholder="Cari teks soal"
            prefix={<SearchOutlined style={{ color: "var(--tl-muted)" }} />}
            allowClear
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ flex: "1 1 260px" }}
          />
          <Select
            style={{ width: 280 }}
            value={selectedType}
            onChange={setSelectedType}
            options={[{ value: "", label: "Semua jenis" }, ...typeList.map(({ value, label }) => ({ value, label: KNOWN_TYPE_LABELS[value] || label }))]}
          />
          <Select
            style={{ width: 160 }}
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: "Terbaru", value: "newest" },
              { label: "Terlama", value: "oldest" },
            ]}
          />
        </div>
        <Space size={[8, 8]} wrap style={{ marginTop: 14 }}>
          <Tag.CheckableTag checked={!selectedType} onChange={() => setSelectedType("")}>
            Semua · {questions.length}
          </Tag.CheckableTag>
          {typeList.map(({ value }) => (
            <Tag.CheckableTag key={value} checked={selectedType === value} onChange={() => setSelectedType(selectedType === value ? "" : value)}>
              {value.toUpperCase()} · {typeCounts[value] || 0}
            </Tag.CheckableTag>
          ))}
        </Space>
      </Card>

      {isLoading ? (
        <Card className="tl-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : filteredQuestions.length === 0 ? (
        <Card className="tl-card">
          <Empty description="Tidak ada soal yang cocok dengan filter." />
        </Card>
      ) : (
        <>
          {pageQuestions.map((question, position) => {
            const isOpen = Boolean(expanded[question.bank_soal_id]);
            const isTKP = question.type === "tkp";
            const correct = correctIndex(question);
            const number = (currentPage - 1) * pageSize + position + 1;
            return (
              <Card key={question.bank_soal_id} className="tl-card" bodyStyle={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <Text strong style={{ color: "var(--tl-muted)" }}>
                    #{number}
                  </Text>
                  <Tag color={TYPE_COLORS[question.type] || "default"} style={{ margin: 0 }}>
                    {getQuestionTypeName(question.type)}
                  </Tag>
                  {question.is_ai_generated && (
                    <Tag icon={<RobotOutlined />} color="purple" style={{ margin: 0 }}>
                      AI
                    </Tag>
                  )}
                  {question.created_at && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(question.created_at).locale("id").format("D MMM YYYY")}
                    </Text>
                  )}
                  <span style={{ flex: 1 }} />
                  <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(question)}>
                    Edit
                  </Button>
                </div>

                {/* The question is HTML; clamp it with CSS so it never cuts mid-markup. */}
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "var(--tl-ink)",
                    whiteSpace: "pre-line",
                    overflowWrap: "anywhere",
                    ...(isOpen
                      ? {}
                      : { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
                  }}
                  dangerouslySetInnerHTML={{ __html: question.text }}
                />

                {isOpen ? (
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                    {question.image_url && (
                      <img src={question.image_url} alt="Gambar soal" style={{ maxWidth: "100%", borderRadius: 10 }} />
                    )}
                    {renderOptions(question)}
                    {question.explanation && (
                      <div style={{ padding: 16, borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
                        <Text strong style={{ color: "#b45309", display: "block", marginBottom: 6 }}>
                          Pembahasan
                        </Text>
                        <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: question.explanation }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <Space size={8} wrap style={{ marginTop: 12 }}>
                    <Tag style={{ margin: 0 }}>{(question.options || []).length} pilihan</Tag>
                    {isTKP ? (
                      <Tag color="lime" style={{ margin: 0 }}>
                        Bobot TKP 1–5
                      </Tag>
                    ) : correct >= 0 ? (
                      <Tag color="green" style={{ margin: 0 }}>
                        Kunci: {String.fromCharCode(65 + correct)}
                      </Tag>
                    ) : (
                      <Tag color="red" style={{ margin: 0 }}>
                        Kunci tidak cocok dengan pilihan
                      </Tag>
                    )}
                    {question.explanation && <Tag style={{ margin: 0 }}>Ada pembahasan</Tag>}
                  </Space>
                )}

                <div style={{ marginTop: 8 }}>
                  <Button
                    type="link"
                    style={{ paddingInline: 0 }}
                    onClick={() => setExpanded((prev) => ({ ...prev, [question.bank_soal_id]: !isOpen }))}
                  >
                    {isOpen ? "Ringkas" : "Lihat soal lengkap & pilihan jawaban"}
                  </Button>
                </div>
              </Card>
            );
          })}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredQuestions.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              showTotal={(total) => `${total} soal`}
            />
          </div>
        </>
      )}

      {editing && (
        <ModalUpdateBankSoal
          isModalOpen={Boolean(editing)}
          setIsModalOpen={(open: boolean) => !open && setEditing(null)}
          questionData={editing}
          onSuccess={() => window.location.reload()}
        />
      )}

      <ModalCreateBankSoal
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        category={category}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};

export default BankSoalScreen;
