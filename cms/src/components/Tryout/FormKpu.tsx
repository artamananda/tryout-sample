import { Button, Divider, Form, Input, Typography } from "antd";
import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";
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

const FormKpu = () => {
  const [value, setValue] = useState("");
  const handleUpdateQuestion = (data: any) => {
    console.log(data);
  };
  return (
    <Form layout="vertical" onFinish={handleUpdateQuestion}>
      <Title>Kemampuan Penalaran Umum</Title>
      {Array.from({ length: 30 }, (_, index) => (
        <React.Fragment key={index}>
          <Form.Item
            name={`question_${index + 1}_kpu`}
            label={`Question ${index + 1}`}
          >
            <ReactQuill
              style={{ backgroundColor: "white" }}
              theme="snow"
              value={value}
              onChange={setValue}
              modules={quillModules}
              formats={quillFormats}
            />
          </Form.Item>

          <Form.Item
            name={`option_${index + 1}_A_kpu`}
            label={`Option ${index + 1} A`}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_B_kpu`}
            label={`Option ${index + 1} B`}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_C_kpu`}
            label={`Option ${index + 1} C`}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_D_kpu`}
            label={`Option ${index + 1} D`}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_E_kpu`}
            label={`Option ${index + 1} E`}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name={`answer_${index + 1}_kpu`}
            label={`Answer ${index + 1}`}
          >
            <Input />
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

export default FormKpu;
