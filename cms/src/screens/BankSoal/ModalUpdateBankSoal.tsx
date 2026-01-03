import {
  Button,
  Divider,
  Dropdown,
  Form,
  Image,
  Input,
  MenuProps,
  Space,
  Upload,
  UploadProps,
  message,
} from "antd";
import ModalUi from "../../components/Ui/Modal";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { DeleteFilled, DownOutlined, UploadOutlined } from "@ant-design/icons";
import { apiUpdateBankSoal } from "../../api/ai"; // Import our new API
import { getErrorMessage } from "../../helpers/errorHandler";
import { MdEdit, MdImageNotSupported } from "react-icons/md";
import ButtonUi from "../../components/Ui/Button";
import { IoReload } from "react-icons/io5";
import SwitchButton from "../../components/Ui/SwitchButton";
import { QuestionProps } from "../../types/question";
// Assuming QuestionProps is generic enough, or redefine specific type if needed.
// BankSoalResponse is returned by API.
import { BankSoalResponse, CreateBankSoalRequest } from "../../types/ai.type";
import { imageUpload } from "../../api/question"; // Reuse image upload or create new bank-soal specific?
// For now, reuse question image upload IF backend supports generic upload. But backend imageUpload is /question/:id/upload-image.
// BankSoal doesn't have image upload endpoint yet.
// I'll skip image change for now or use generic upload if available.
// User said "features like in there".
// Assuming image uploads to S3 and returns URL.
// I will implement simple URL input or reuse logic if I add endpoint.
// For now, I'll allow Text changes first and Explanation.
// Re-using imageUpload meant for Question might fail if ID not found in Question table.
// I'll comment out image upload logic for BankSoal ID or implement it later.

type PropTypes = {
  setIsModalOpen: (val: boolean) => void;
  isModalOpen: boolean;
  questionData: any; // BankSoalResponse or similar
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
  const [image, setImage] = useState<string>(questionData?.image_url || "");
  const [isOptions, setIsOptions] = useState<boolean>(
    questionData?.is_options ?? true
  );

  // Sync when modal opens or data changes
  useEffect(() => {
    if (isModalOpen && questionData) {
      setQuestionText(questionData.text || "");
      setOptions(questionData.options || Array.from({ length: 5 }, () => ""));
      setAnswer(questionData.correct_answer || "");
      setExplanation(questionData.explanation || "");
      setImage(questionData.image_url || "");
      setIsOptions(questionData.is_options ?? true);
    }
  }, [isModalOpen, questionData]);

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

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const handleUpdate = async () => {
    try {
      const payload: CreateBankSoalRequest = {
        type: questionData.type, // Keep existing type
        text: questionText,
        options: isOptions && options.every((o) => o !== "") ? options : [],
        correct_answer: answer,
        explanation: explanation,
        difficulty: questionData.difficulty || "medium",
        topic: questionData.topic || "",
        image_url: image, // Optional: if unchanged
        is_options: isOptions,
        points: questionData.points || 0,
        is_ai_generated: questionData.is_ai_generated,
      };

      const res = await apiUpdateBankSoal(
        questionData.bank_soal_id || questionData.question_id,
        payload
      );
      if (res) {
        message.success("Question updated successfully");
        setIsModalOpen(false);
        onSuccess();
      }
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  return (
    <ModalUi
      isModalOpen={isModalOpen}
      handleOk={handleUpdate}
      handleCancel={() => setIsModalOpen(false)}
      title="Edit Bank Soal Question"
    >
      <Form layout="vertical" onFinish={handleUpdate}>
        {/* Question Text */}
        <Form.Item label="Question Text (Soal)">
          <ReactQuill
            theme="snow"
            value={questionText}
            onChange={setQuestionText}
            modules={quillModules}
            formats={quillFormats}
            style={{ backgroundColor: "white" }}
          />
        </Form.Item>

        <Form.Item label="Explanation (Pembahasan)">
          <ReactQuill
            theme="snow"
            value={explanation}
            onChange={setExplanation}
            modules={quillModules}
            formats={quillFormats}
            style={{ backgroundColor: "white" }}
            placeholder="Tulis pembahasan disini..."
          />
        </Form.Item>

        {/* Options Switch */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>Mode Pilihan Ganda:</span>
          <SwitchButton
            defaultChecked={isOptions}
            onChange={(checked) => setIsOptions(checked)}
          />
        </div>

        {isOptions && (
          <>
            {options.map((opt, idx) => (
              <Form.Item key={idx} label={`Option ${optLabels[idx]}`}>
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${optLabels[idx]}`}
                />
              </Form.Item>
            ))}

            <Form.Item label="Correct Answer">
              <Dropdown menu={menuProps}>
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
        <Button type="primary" htmlType="submit" block size="large">
          Update Question
        </Button>
      </Form>
    </ModalUi>
  );
};

export default ModalUpdateBankSoal;
