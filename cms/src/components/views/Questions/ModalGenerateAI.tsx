import { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  message,
  Spin,
} from "antd";
import {
  RobotOutlined,
  CheckOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { apiGenerateQuestions } from "../../../api/ai";
import {
  GeneratedQuestion,
  GenerateQuestionsRequest,
} from "../../../types/ai.type";
import { apiCreateQuestion } from "../../../api/question";
import { QuestionProps } from "../../../types/question";

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

interface ModalGenerateAIProps {
  isOpen: boolean;
  onClose: () => void;
  tryoutId: string;
  questionType: string;
  onQuestionsCreated: () => void;
}

const ModalGenerateAI = ({
  isOpen,
  onClose,
  tryoutId,
  questionType,
  onQuestionsCreated,
}: ModalGenerateAIProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);
  const [step, setStep] = useState<"form" | "preview">("form");

  const handleGenerate = async (values: any) => {
    setLoading(true);
    try {
      const request: GenerateQuestionsRequest = {
        topic: values.topic,
        question_type: questionType,
        number_of_questions: values.numberOfQuestions,
        difficulty: values.difficulty,
        context: values.context || "",
      };

      const response = await apiGenerateQuestions(request);
      if (response && response.questions && response.questions.length > 0) {
        setGeneratedQuestions(response.questions);
        setStep("preview");
        message.success(`Generated ${response.questions.length} questions!`);
      } else {
        message.error("Failed to generate questions. Please try again.");
      }
    } catch (error) {
      message.error("Error generating questions");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      let successCount = 0;
      for (let i = 0; i < generatedQuestions.length; i++) {
        const q = generatedQuestions[i];
        const createRequest = {
          tryout_id: tryoutId,
          local_id: i + 1,
          type: questionType,
          text: q.text,
          options: q.options,
          correct_answer: q.correct_answer,
          is_options: true,
        };

        const result = await apiCreateQuestion(createRequest);
        if (result) {
          successCount++;
        }
      }

      if (successCount > 0) {
        message.success(`Successfully created ${successCount} questions!`);
        onQuestionsCreated();
        handleClose();
      }
    } catch (error) {
      message.error("Error saving questions");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = () => {
    setStep("form");
    setGeneratedQuestions([]);
  };

  const handleClose = () => {
    setStep("form");
    setGeneratedQuestions([]);
    form.resetFields();
    onClose();
  };

  const getQuestionTypeName = (code: string) => {
    const typeNames: Record<string, string> = {
      kpu: "Penalaran Umum",
      ppu: "Pengetahuan dan Pemahaman Umum",
      pbm: "Pemahaman Bacaan dan Menulis",
      pku: "Pengetahuan Kuantitatif",
      ind: "Literasi Bahasa Indonesia",
      ing: "Literasi Bahasa Inggris",
      mtk: "Penalaran Matematika",
    };
    return typeNames[code] || code.toUpperCase();
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: "#8C59F1" }} />
          <span>Generate Questions with AI</span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      {step === "form" ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
          initialValues={{
            numberOfQuestions: 5,
            difficulty: "medium",
          }}
        >
          <div
            style={{
              backgroundColor: "#f0f0ff",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <Text>
              Question Type:{" "}
              <strong>{getQuestionTypeName(questionType)}</strong> (
              {questionType.toUpperCase()})
            </Text>
          </div>

          <Form.Item
            name="topic"
            label="Topic / Subject"
            rules={[{ required: true, message: "Please enter a topic" }]}
          >
            <Input placeholder="e.g., Basic Algebra, Indonesian Grammar, World History" />
          </Form.Item>

          <Form.Item
            name="context"
            label="Additional Context (Optional)"
            tooltip="Provide additional material or context for more specific questions"
          >
            <TextArea
              rows={4}
              placeholder="Paste study material, article, or additional context here..."
            />
          </Form.Item>

          <Space size="large">
            <Form.Item
              name="numberOfQuestions"
              label="Number of Questions"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={20} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="Difficulty Level"
              rules={[{ required: true }]}
            >
              <Select style={{ width: 150 }}>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: "16px" }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<RobotOutlined />}
              style={{ backgroundColor: "#8C59F1" }}
              size="large"
            >
              {loading ? "Generating..." : "Generate Questions"}
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              Generated Questions ({generatedQuestions.length})
            </Title>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRegenerate}>
                Regenerate
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleConfirm}
                loading={saving}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                {saving ? "Saving..." : "Confirm & Save All"}
              </Button>
            </Space>
          </div>

          {saving && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Spin size="large" />
              <p>Saving questions...</p>
            </div>
          )}

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {generatedQuestions.map((q, index) => (
              <Card
                key={index}
                size="small"
                style={{ marginBottom: "12px" }}
                title={<Text strong>Question {index + 1}</Text>}
              >
                <p style={{ marginBottom: "8px" }}>{q.text}</p>
                <Divider style={{ margin: "8px 0" }} />
                <div style={{ paddingLeft: "16px" }}>
                  {q.options.map((opt, optIndex) => (
                    <p
                      key={optIndex}
                      style={{
                        margin: "4px 0",
                        fontWeight: opt.startsWith(q.correct_answer)
                          ? "bold"
                          : "normal",
                        color: opt.startsWith(q.correct_answer)
                          ? "#52c41a"
                          : "inherit",
                      }}
                    >
                      {opt} {opt.startsWith(q.correct_answer) && "✓"}
                    </p>
                  ))}
                </div>
                {q.explanation && (
                  <>
                    <Divider style={{ margin: "8px 0" }} />
                    <Text type="secondary" italic>
                      Explanation: {q.explanation}
                    </Text>
                  </>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ModalGenerateAI;
