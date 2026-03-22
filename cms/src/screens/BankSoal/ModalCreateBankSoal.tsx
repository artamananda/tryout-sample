import {
  Button,
  Divider,
  Dropdown,
  Form,
  Input,
  MenuProps,
  Select,
  Space,
  message,
} from "antd";
import ModalUi from "../../components/Ui/Modal";
import React, { useState } from "react";
import ReactQuill from "react-quill";
import { DownOutlined, PlusOutlined } from "@ant-design/icons";
import { apiSaveToBankSoal } from "../../api/ai";
import { getErrorMessage } from "../../helpers/errorHandler";
import SwitchButton from "../../components/Ui/SwitchButton";
import {
  getAllQuestionTypes,
  saveCustomType,
  DIFFICULTY_OPTIONS,
} from "./questionTypes";

type PropTypes = {
  setIsModalOpen: (val: boolean) => void;
  isModalOpen: boolean;
  onSuccess: () => void;
};

const ModalCreateBankSoal = (props: PropTypes) => {
  const { setIsModalOpen, isModalOpen, onSuccess } = props;

  const [questionType, setQuestionType] = useState<string>("kpu");
  const [questionText, setQuestionText] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", "", "", "", ""]);
  const [answer, setAnswer] = useState<string>("A");
  const [explanation, setExplanation] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [topic, setTopic] = useState<string>("");
  const [isOptions, setIsOptions] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [newTypeName, setNewTypeName] = useState<string>("");

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  const optLabels = ["A", "B", "C", "D", "E"];

  const items: MenuProps["items"] = options.map((option, index) => {
    const text = option || "";
    const cleanText = text.replace(/^[A-E][. )]+/, "").trim();
    return {
      label: `${optLabels[index]}. ${
        cleanText.length > 50 ? cleanText.slice(0, 50) + "..." : cleanText
      }`,
      key: optLabels[index],
    };
  });

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    setAnswer(e.key);
  };

  const menuProps = { items, onClick: handleMenuClick };

  const resetForm = () => {
    setQuestionType("kpu");
    setQuestionText("");
    setOptions(["", "", "", "", ""]);
    setAnswer("A");
    setExplanation("");
    setDifficulty("medium");
    setTopic("");
    setIsOptions(true);
  };

  const handleCreate = async () => {
    if (!questionText.trim()) {
      message.error("Silakan masukkan teks soal");
      return;
    }
    if (isOptions && options.filter((o) => o.trim()).length < 2) {
      message.error("Silakan masukkan minimal 2 opsi jawaban");
      return;
    }

    const normalizedOptions = isOptions ? options.map((o) => o.trim()) : [];
    const answerIndex = optLabels.indexOf(answer);
    const resolvedCorrectAnswer =
      isOptions && answerIndex >= 0
        ? normalizedOptions[answerIndex] || ""
        : answer.trim();

    if (!resolvedCorrectAnswer) {
      message.error("Silakan pilih jawaban benar yang valid");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        questions: [
          {
            type: questionType,
            text: questionText,
            options: isOptions ? normalizedOptions.filter((o) => o) : [],
            correct_answer: resolvedCorrectAnswer,
            explanation: explanation,
            difficulty: difficulty,
            topic: topic,
            is_options: isOptions,
            points: 1,
            is_ai_generated: false,
          },
        ],
      };
      const res = await apiSaveToBankSoal(payload);
      if (res && res.length > 0) {
        message.success("Soal berhasil dibuat!");
        setIsModalOpen(false);
        resetForm();
        onSuccess();
      }
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const sectionStyle = {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid #f0f0f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  };

  const sectionHeaderStyle = {
    fontSize: 14,
    fontWeight: 600 as const,
    color: "#8C59F1",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <ModalUi
      isModalOpen={isModalOpen}
      handleOk={handleCreate}
      handleCancel={handleCancel}
      title="✨ Buat Soal Baru"
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
        <Form layout="vertical" onFinish={handleCreate}>
          {/* Section: Basic Info */}
          <div
            style={{
              ...sectionStyle,
              background: "linear-gradient(135deg, #f9f0ff 0%, #f5edff 100%)",
              border: "1px solid #e8dcf8",
            }}
          >
            <div style={sectionHeaderStyle}>📋 Informasi Dasar</div>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Jenis Soal</span>}
              required
              style={{ marginBottom: 16 }}
            >
              <Select
                value={questionType}
                onChange={(val) => setQuestionType(val)}
                style={{ width: "100%" }}
                options={getAllQuestionTypes()}
                size="large"
                showSearch
                placeholder="Pilih atau buat jenis soal baru"
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
                          placeholder="Nama jenis soal baru..."
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newTypeName.trim()) {
                              saveCustomType(newTypeName.trim());
                              setQuestionType(newTypeName.trim());
                              message.success(
                                `Jenis soal "${newTypeName.trim()}" ditambahkan!`,
                              );
                              setNewTypeName("");
                            }
                            e.stopPropagation();
                          }}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          disabled={!newTypeName.trim()}
                          onClick={() => {
                            if (newTypeName.trim()) {
                              saveCustomType(newTypeName.trim());
                              setQuestionType(newTypeName.trim());
                              message.success(
                                `Jenis soal "${newTypeName.trim()}" ditambahkan!`,
                              );
                              setNewTypeName("");
                            }
                          }}
                          style={{
                            background: "#8C59F1",
                            borderColor: "#8C59F1",
                          }}
                        >
                          Tambah
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              />
            </Form.Item>

            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Kesulitan</span>}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Select
                  value={difficulty}
                  onChange={setDifficulty}
                  options={DIFFICULTY_OPTIONS}
                  size="large"
                />
              </Form.Item>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Topik</span>}
                style={{ flex: 2, marginBottom: 0 }}
              >
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Logika, Aritmatika"
                  size="large"
                />
              </Form.Item>
            </div>
          </div>

          {/* Section: Question Content */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>✏️ Konten Soal</div>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Teks Soal</span>}
              required
              style={{ marginBottom: 16 }}
            >
              <ReactQuill
                theme="snow"
                value={questionText}
                onChange={setQuestionText}
                modules={quillModules}
                formats={quillFormats}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Pembahasan</span>}
              style={{ marginBottom: 0 }}
            >
              <ReactQuill
                theme="snow"
                value={explanation}
                onChange={setExplanation}
                modules={quillModules}
                formats={quillFormats}
              />
            </Form.Item>
          </div>

          {/* Section: Options */}
          <div style={sectionStyle}>
            <div
              style={{
                ...sectionHeaderStyle,
                justifyContent: "space-between",
              }}
            >
              <span>📝 Pilihan Jawaban</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#666", fontWeight: 400 }}>
                  Pilihan Ganda
                </span>
                <SwitchButton
                  defaultChecked={isOptions}
                  onChange={setIsOptions}
                />
              </div>
            </div>

            {isOptions && (
              <>
                {optLabels.map((label, index) => (
                  <Form.Item
                    key={label}
                    label={
                      <span style={{ fontWeight: 500 }}>Opsi {label}</span>
                    }
                    style={{ marginBottom: 12 }}
                  >
                    <Input
                      value={options[index]}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Masukkan opsi ${label}`}
                      size="large"
                      prefix={
                        <span style={{ fontWeight: 600, color: "#8C59F1" }}>
                          {label}.
                        </span>
                      }
                    />
                  </Form.Item>
                ))}

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Jawaban Benar</span>}
                  required
                >
                  <Dropdown menu={menuProps}>
                    <Button
                      size="large"
                      style={{
                        width: "100%",
                        borderColor: "#8C59F1",
                        color: "#666",
                      }}
                    >
                      <Space
                        style={{
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span>
                          Jawaban:{" "}
                          <strong style={{ color: "#52c41a" }}>{answer}</strong>
                        </span>
                        <DownOutlined />
                      </Space>
                    </Button>
                  </Dropdown>
                </Form.Item>
              </>
            )}
          </div>

          {/* Submit Button */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size="large"
              style={{
                background: "linear-gradient(135deg, #8C59F1 0%, #9e73f8 100%)",
                border: "none",
                height: 52,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 12,
                boxShadow: "0 4px 14px rgba(140, 89, 241, 0.3)",
              }}
            >
              ✨ Buat Soal
            </Button>
          </Form.Item>
        </Form>
      </div>
    </ModalUi>
  );
};

export default ModalCreateBankSoal;
