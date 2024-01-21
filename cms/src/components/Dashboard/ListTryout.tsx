import React, { useState } from "react";
import { Table, Tag, Typography, Modal, Form, Input, Button } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Text, Link } = Typography;

interface DataType {
  key: string;
  tryout: string;
  startTime: Date;
  endTime: Date;
}

type FieldType = {
  token?: string;
};

const data: DataType[] = [
  {
    key: "1",
    tryout: "Tryout December",
    startTime: new Date("2023-12-21T12:00:00"),
    endTime: new Date("2023-12-31T14:00:00"),
  },
  {
    key: "2",
    tryout: "Tryout January",
    startTime: new Date("2024-01-21T12:00:00"),
    endTime: new Date("2024-01-31T20:00:00"),
  },
  {
    key: "3",
    tryout: "Tryout February",
    startTime: new Date("2024-02-21T12:00:00"),
    endTime: new Date("2024-02-21T14:00:00"),
  },
];

const ListTryout = () => {
  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Tryout",
      dataIndex: "tryout",
      key: "tryout",
      render: (_, record) => (
        <Link underline onClick={() => showModal(record.tryout)}>
          {record.tryout}
        </Link>
      ),
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      render: (_, { startTime }) => (
        <Text>{formatDateToCustomString(startTime)}</Text>
      ),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      render: (_, { endTime }) => (
        <Text>{formatDateToCustomString(endTime)}</Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (_, { startTime, endTime }) => (
        <Tag color={statusColor(checkStatus(startTime, endTime))}>
          {checkStatus(startTime, endTime)}
        </Tag>
      ),
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Input Token");
  const [form] = Form.useForm();

  const showModal = (modalTitle: string) => {
    setModalTitle(modalTitle);
    setIsModalOpen(true);
  };

  function formatDateToCustomString(date: any) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    };

    const formattedDate = date
      .toLocaleDateString("id-ID", options)
      .replace(/,/g, "");

    return formattedDate;
  }

  const statusColor = (status: string) => {
    if (status === "ON GOING") {
      return "green";
    } else if (status === "IN COMING") {
      return "blue";
    } else {
      return "red";
    }
  };

  const checkStatus = (startTime: Date, endTime: Date) => {
    if (startTime < new Date() && endTime > new Date()) {
      return "ON GOING";
    } else if (startTime > new Date()) {
      return "IN COMING";
    } else if (endTime < new Date()) {
      return "FINISHED";
    } else {
      return "UNKNOWN";
    }
  };

  const onFinish = (values: any) => {
    console.log("Success:", values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div>
      <Button
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          justifyItems: "flex-end",
          paddingBlock: 20,
          color: "white",
          backgroundColor: "#04073B",
        }}
      >
        <PlusOutlined />
        Create Tryout
      </Button>
      <Table columns={columns} dataSource={data} />

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={form.submit}
      >
        <Form
          form={form}
          name="basic"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item<FieldType>
            label="Token"
            name="token"
            rules={[{ required: true, message: "Please input your token!" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListTryout;
