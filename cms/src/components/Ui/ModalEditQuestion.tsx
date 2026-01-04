import {
  Button,
  Divider,
  Dropdown,
  Form,
  Input,
  MenuProps,
  message,
} from "antd";
import ModalUi from "./Modal";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { DownOutlined } from "@ant-design/icons";
import SwitchButton from "./SwitchButton";

// Define a generic interface for Question Data (Bank Soal or Generated)
// GeneratedQuestion: { text, options, correct_answer, explanation, type }
// BankSoalResponse: { text, options, correct_answer, explanation, type, image_url, ... }
export interface EditQuestionData {
  text: string;
  options?: string[]; // Array of strings
  correct_answer: string;
  explanation?: string;
  type?: string;
  is_options?: boolean;
  image_url?: string;
}

type PropTypes = {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  initialData: any; // Can be any object structure, we map it to state
  onSave: (data: EditQuestionData) => void;
  title?: string;
  zIndex?: number;
};

const ModalEditQuestion = (props: PropTypes) => {
  const {
    setIsModalOpen,
    isModalOpen,
    initialData,
    onSave,
    title = "Edit Question",
    zIndex,
  } = props;

  // State
  const [questionText, setQuestionText] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [isOptions, setIsOptions] = useState<boolean>(true);

  // Sync state with initialData
  useEffect(() => {
    if (isModalOpen && initialData) {
      setQuestionText(initialData.text || "");
      setOptions(initialData.options || Array.from({ length: 5 }, () => ""));
      setAnswer(initialData.correct_answer || "");
      setExplanation(initialData.explanation || "");

      // Detect isOptions
      if (initialData.is_options !== undefined) {
        setIsOptions(initialData.is_options);
      } else {
        // Infer from options array presence or type
        // If options array has content, default to true, unless type is essay?
        const hasOptions =
          initialData.options && initialData.options.length > 0;
        // type check?
        if (
          initialData.type === "essay" ||
          initialData.type === "short_answer"
        ) {
          setIsOptions(false);
        } else {
          setIsOptions(!!hasOptions);
        }
      }
    }
  }, [isModalOpen, initialData]);

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
        ["formula"],
        [{ color: [] }],
      ],
    },
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "formula",
    "align",
    "color",
    "link",
    "image",
  ];

  const optLabels = ["A", "B", "C", "D", "E"];

  const items: MenuProps["items"] = options.map((option, index) => {
    // Strip "A. ", "B. ", etc from start if present to avoid double label "A. A. Answer"
    const text = option || "";
    // Remove "A. ", "A. ", "A)", etc. Case insensitive for letter if needed, but usually matches index.
    const cleanText = text.replace(/^[A-E][. )]+/, "").trim();

    return {
      label: `${optLabels[index]}. ${
        cleanText.length > 50 ? cleanText.slice(0, 50) + "..." : cleanText
      }`,
      key: optLabels[index],
    };
  });

  const handleSave = () => {
    // Validate
    if (!questionText) {
      message.error("Question text is required");
      return;
    }

    const payload: EditQuestionData = {
      ...initialData, // Keep other fields
      text: questionText,
      options: isOptions && options.every((o) => o !== "") ? options : [],
      correct_answer: answer,
      explanation: explanation,
      is_options: isOptions,
    };

    onSave(payload);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  return (
    <ModalUi
      isModalOpen={isModalOpen}
      handleOk={handleSave}
      handleCancel={() => setIsModalOpen(false)}
      title={title}
      zIndex={zIndex}
    >
      <Form layout="vertical">
        <Form.Item label="Question Text">
          <ReactQuill
            theme="snow"
            value={questionText}
            onChange={setQuestionText}
            modules={quillModules}
            formats={quillFormats}
            style={{ backgroundColor: "white" }}
          />
        </Form.Item>

        <Form.Item label="Explanation">
          <ReactQuill
            theme="snow"
            value={explanation}
            onChange={setExplanation}
            modules={quillModules}
            formats={quillFormats}
            style={{ backgroundColor: "white" }}
            placeholder="Explanation..."
          />
        </Form.Item>

        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>Option Mode:</span>
          <SwitchButton
            defaultChecked={isOptions}
            onChange={(checked) => setIsOptions(checked)}
          />
        </div>

        {isOptions && (
          <>
            {options.map((opt, idx) => (
              <Form.Item
                key={idx}
                label={`Option ${optLabels[idx]}`}
                style={{ marginBottom: 10 }}
              >
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${optLabels[idx]}`}
                />
              </Form.Item>
            ))}

            <Form.Item label="Correct Answer" style={{ marginTop: 10 }}>
              <Dropdown
                menu={{
                  items,
                  onClick: (e) => setAnswer(e.key),
                }}
              >
                <Button block style={{ textAlign: "left" }}>
                  {answer ? `Answer: ${answer}` : "Select Correct Answer"}{" "}
                  <DownOutlined style={{ float: "right" }} />
                </Button>
              </Dropdown>
            </Form.Item>
          </>
        )}

        {!isOptions && (
          <Form.Item label="Correct Answer (Essay)">
            <Input.TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={2}
            />
          </Form.Item>
        )}

        <Divider />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Form>
    </ModalUi>
  );
};

export default ModalEditQuestion;
