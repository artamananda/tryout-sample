import { Button, Divider, Form, Input, Typography, message } from "antd";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";
import { CreateQuestionRequest } from "../../types/question";
import { getErrorMessage } from "../../helpers/errorHandler";
import { doCreateQuestions } from "../../api/question";
window.katex = katex;

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
];

const { Title } = Typography;

const FormPpu = () => {
  const questionLength = 20;
  const questionType = "ppu";
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const parts = pathname.split("/");
  const tryoutId = parts[parts.length - 3];
  const [questions, setQuestions] = useState<string[]>(
    Array.from({ length: questionLength }, () => "")
  );

  const [options, setOptions] = useState<string[][]>(
    Array.from({ length: questionLength }, () =>
      Array.from({ length: 5 }, () => "")
    )
  );

  const [answers, setAnswers] = useState<string[]>(
    Array.from({ length: questionLength }, () => "")
  );

  const handleUpdateQuestion = async (data: any) => {
    try {
      let newData: CreateQuestionRequest[] = [];
      for (let i = 0; i < questionLength; i++) {
        const createQuestion: CreateQuestionRequest = {
          tryout_id: tryoutId,
          type: questionType,
          text: questions[i],
          options: options[i],
          correct_answer: answers[i],
        };
        newData.push(createQuestion);
      }
      await doCreateQuestions(newData);
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const updateQuestionAtIndex = (index: number, newValue: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = newValue;
    setQuestions(updatedQuestions);
  };

  const updateOptionAtIndex = (
    index: number,
    subIndex: number,
    newValue: string
  ) => {
    const updatedOptions = [...options];
    updatedOptions[index][subIndex] = newValue;
    setOptions(updatedOptions);
  };

  const updateAnswerAtIndex = (index: number, newValue: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = newValue;
    setAnswers(updatedAnswers);
  };

  useEffect(() => {
    console.log(questions);
  }, [questions]);
  return (
    <Form layout="vertical" onFinish={handleUpdateQuestion}>
      <Title>Pengetahuan dan Pemahaman Umum</Title>
      {Array.from({ length: questionLength }, (_, index) => (
        <React.Fragment key={index}>
          <Form.Item
            name={`question_${index + 1}_ppu`}
            label={`Question ${index + 1}`}
          >
            <ReactQuill
              style={{ backgroundColor: "white" }}
              theme="snow"
              value={questions[index]}
              onChange={(value) => updateQuestionAtIndex(index, value)}
              modules={quillModules}
              formats={quillFormats}
            />
          </Form.Item>

          <Form.Item
            name={`option_${index + 1}_A_ppu`}
            label={`Option ${index + 1} A`}
          >
            <Input
              onChange={(e) => updateOptionAtIndex(index, 0, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_B_ppu`}
            label={`Option ${index + 1} B`}
          >
            <Input
              onChange={(e) => updateOptionAtIndex(index, 1, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_C_ppu`}
            label={`Option ${index + 1} C`}
          >
            <Input
              onChange={(e) => updateOptionAtIndex(index, 2, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_D_ppu`}
            label={`Option ${index + 1} D`}
          >
            <Input
              onChange={(e) => updateOptionAtIndex(index, 3, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_E_ppu`}
            label={`Option ${index + 1} E`}
          >
            <Input
              onChange={(e) => updateOptionAtIndex(index, 4, e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name={`answer_${index + 1}_ppu`}
            label={`Answer ${index + 1}`}
          >
            <Input
              value={answers[index]}
              onChange={(e) => updateAnswerAtIndex(index, e.target.value)}
            />
          </Form.Item>

          <Divider />
        </React.Fragment>
      ))}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={{
            display: "flex",
            width: "100%",
            paddingBlock: 20,
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            marginTop: 10,
          }}
        >
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormPpu;
