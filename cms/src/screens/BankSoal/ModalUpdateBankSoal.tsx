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
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { DownOutlined, PlusOutlined } from "@ant-design/icons";
import { apiUpdateBankSoal } from "../../api/ai";
import { getErrorMessage } from "../../helpers/errorHandler";
import SwitchButton from "../../components/Ui/SwitchButton";
import { BankSoalResponse, CreateBankSoalRequest } from "../../types/ai.type";
import {
  getAllQuestionTypes,
  saveCustomType,
  DIFFICULTY_OPTIONS,
} from "./questionTypes";

type PropTypes = {
  setIsModalOpen: (val: boolean) => void;
  isModalOpen: boolean;
  questionData: any;
  onSuccess: () => void;
};

const ModalUpdateBankSoal = (props: PropTypes) => {
  const { setIsModalOpen, isModalOpen, questionData, onSuccess } = props;

  const [questionText, setQuestionText] = useState<string>(
    questionData?.text || ""
  );
  const [options, setOptions] = useState<string[]>(
    questionData?.options || Array.from({ length: 5 }, () => "")
  );
  const [answer, setAnswer] = useState<string>(
    questionData?.correct_answer || ""
  );
  const [explanation, setExplanation] = useState<string>(
    questionData?.explanation || ""
  );
  const [isOptions, setIsOptions] = useState<boolean>(
    questionData?.is_options ?? true
  );
  const [questionType, setQuestionType] = useState<string>(
    questionData?.type || "kpu"
  );
  const [difficulty, setDifficulty] = useState<string>(
    questionData?.difficulty || "medium"
  );
  const [topic, setTopic] = useState<string>(questionData?.topic || "");
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen && questionData) {
      setQuestionText(questionData.text || "");
      setOptions(questionData.options || Array.from({ length: 5 }, () => ""));
      setAnswer(questionData.correct_answer || "");
      setExplanation(questionData.explanation || "");
      setIsOptions(questionData.is_options ?? true);
      setQuestionType(questionData.type || "kpu");
      setDifficulty(questionData.difficulty || "medium");
      setTopic(questionData.topic || "");
    }
  }, [isModalOpen, questionData]);

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

  const handleMenuClick: MenuProps["onClick"] = (e) => setAnswer(e.key);
  const menuProps = { items, onClick: handleMenuClick };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const payload: CreateBankSoalRequest = {
        type: questionType,
        text: questionText,
        options: isOptions && options.every((o) => o !== "") ? options : [],
        correct_answer: answer,
        explanation: explanation,
        difficulty: difficulty,
        topic: topic,
        image_url: questionData?.image_url || "",
        is_options: isOptions,
        points: questionData?.points || 0,
        is_ai_generated: questionData?.is_ai_generated,
      };
      const res = await apiUpdateBankSoal(
        questionData.bank_soal_id || questionData.question_id,
        payload
      );
      if (res) {
        message.success("Soal berhasil diperbarui!");
        setIsModalOpen(false);
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
      handleOk={handleUpdate}
      handleCancel={() => setIsModalOpen(false)}
      title="✏️ Edit Soal"
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
        <Form layout="vertical" onFinish={handleUpdate}>
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
                                `Jenis soal "${newTypeName.trim()}" ditambahkan!`
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
                                `Jenis soal "${newTypeName.trim()}" ditambahkan!`
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
              style={{ ...sectionHeaderStyle, justifyContent: "space-between" }}
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
              💾 Simpan Perubahan
            </Button>
          </Form.Item>
        </Form>
      </div>
    </ModalUi>
  );
};

export default ModalUpdateBankSoal;
