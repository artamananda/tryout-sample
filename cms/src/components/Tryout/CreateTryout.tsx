import { Button, Divider, Form, Input, Typography, Switch } from "antd";
import React from "react";
import { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";
window.katex = katex;

const { Title, Text } = Typography;

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

const CreateTryout = () => {
  const [value, setValue] = useState("");
  const [pilgan, setPilgan] = useState(true);

  const handleOption = (checked: boolean) => {
    setPilgan(checked);
  };

  return (
    <div>
      <Form layout="vertical">
        <Title level={3}>Basic Config</Title>
        <Title style={{ fontWeight: "bold" }}>
          {"Tes Potensi Skolastik (TPS)"}
        </Title>
        <Title level={3}>Kemampuan Penalaran Umum</Title>
        {Array.from({ length: 30 }, (_, index) => (
          <React.Fragment key={index}>
            <Form.Item
              name={`question${index}`}
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
            <Form.Item name={`answer${index}`} label={`Answer ${index + 1}`}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <Text>Pilihan Ganda</Text>
                <Switch checked={pilgan} onChange={handleOption} />
              </div>
              {pilgan ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <Input addonBefore="A" />
                  <Input addonBefore="B" />
                  <Input addonBefore="C" />
                  <Input addonBefore="D" />
                  <Input addonBefore="E" />
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <Input />
                </div>
              )}
            </Form.Item>
            <Divider />
          </React.Fragment>
        ))}

        <Title level={3}>Pengetahuan dan Pemahaman Umum</Title>
        <Title level={3}>Kemampuan Memahami Bacaan dan Menulis</Title>
        <Title level={3}>Pengetahuan Kuantitatif</Title>

        <Title style={{ fontWeight: "bold" }}>Tes Literasi</Title>
        <Title level={3}>Literasi Bahasa Indonesia</Title>
        <Title level={3}>Literasi Bahasa Inggris</Title>
        <Title level={3}>Penalaran Matematika</Title>
        <Form.Item>
          <Button
            type="primary"
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
    </div>
  );
};

export default CreateTryout;
