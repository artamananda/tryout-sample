import {
  Button,
  Divider,
  Form,
  Input,
  Typography,
  Upload,
  UploadProps,
  message,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";
import { CreateQuestionRequest } from "../../types/question";
import { getErrorMessage } from "../../helpers/errorHandler";
import { doCreateQuestions } from "../../api/question";
import { ApiGetFileUrlById, S3Upload } from "../../api/awsSdk";
import { UploadOutlined } from "@ant-design/icons";
import { debounce } from "lodash";
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

const FormPku = () => {
  const questionLength = 15;
  const questionType = "pku";
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

  const [images, setImages] = useState<string[]>(
    Array.from({ length: questionLength }, () => "")
  );

  const [idxImg, setIdxImg] = useState(0);

  const props: UploadProps = {
    multiple: false,
    customRequest: async ({ file }) => {
      try {
        const url = await S3Upload(file);
        if (url) {
          message.success(`file uploaded successfully`);
          updateImageAtIndex(idxImg, url);
        }
      } catch (error) {
        message.error(`file upload failed.`);
      }
    },
  };

  const handleUpdateQuestion = async (data: any) => {
    try {
      let newData: CreateQuestionRequest[] = [];
      for (let i = 0; i < questionLength; i++) {
        const createQuestion: CreateQuestionRequest = {
          tryout_id: tryoutId,
          local_id: i + 1,
          type: questionType,
          text: questions[i],
          options: options[i],
          correct_answer: answers[i],
          image_url: images[i] ? ApiGetFileUrlById(images[i]) : undefined,
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

  const updateImageAtIndex = (index: number, newValue: string) => {
    const updatedImages = [...images];
    updatedImages[index] = newValue;
    setImages(updatedImages);
  };

  const debouncedUpdateQuestionAtIndex = useRef(
    debounce((index, value) => {
      updateQuestionAtIndex(index, value);
    }, 300)
  );

  const handleQuestionChange = (index: number, value: any) => {
    debouncedUpdateQuestionAtIndex.current(index, value);
  };

  const debouncedUpdateOptionAtIndex = useRef(
    debounce((index, subIndex, value) => {
      updateOptionAtIndex(index, subIndex, value);
    }, 300)
  );

  const handleOptionChange = (index: number, subIndex: number, value: any) => {
    debouncedUpdateOptionAtIndex.current(index, subIndex, value);
  };

  const debouncedUpdateAnswerAtIndex = useRef(
    debounce((index, value) => {
      updateAnswerAtIndex(index, value);
    }, 300)
  );

  const handleAnswerChange = (index: number, value: any) => {
    debouncedUpdateAnswerAtIndex.current(index, value);
  };

  useEffect(() => {
    console.log(questions);
    console.log(images);
  }, [questions, images]);
  return (
    <Form layout="vertical" onFinish={handleUpdateQuestion}>
      <Title>Kemampuan Kuantitatif</Title>
      {Array.from({ length: questionLength }, (_, index) => (
        <React.Fragment key={index}>
          <Form.Item
            name={`question_${index + 1}_pku`}
            label={`Question ${index + 1}`}
          >
            <ReactQuill
              style={{ backgroundColor: "white" }}
              theme="snow"
              value={questions[index]}
              onChange={(value) => handleQuestionChange(index, value)}
              modules={quillModules}
              formats={quillFormats}
            />
          </Form.Item>

          <Form.Item>
            <Upload {...props} onChange={() => setIdxImg(index)}>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name={`option_${index + 1}_A_pku`}
            label={`Option ${index + 1} A`}
          >
            <Input
              onChange={(e) => handleOptionChange(index, 0, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_B_pku`}
            label={`Option ${index + 1} B`}
          >
            <Input
              onChange={(e) => handleOptionChange(index, 1, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_C_pku`}
            label={`Option ${index + 1} C`}
          >
            <Input
              onChange={(e) => handleOptionChange(index, 2, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_D_pku`}
            label={`Option ${index + 1} D`}
          >
            <Input
              onChange={(e) => handleOptionChange(index, 3, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_E_pku`}
            label={`Option ${index + 1} E`}
          >
            <Input
              onChange={(e) => handleOptionChange(index, 4, e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name={`answer_${index + 1}_pku`}
            label={`Answer ${index + 1}`}
          >
            <Input
              value={answers[index]}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
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

export default FormPku;
