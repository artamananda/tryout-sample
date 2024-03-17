import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Typography,
  DatePicker,
  Button,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
} from "antd";
import type { TableProps } from "antd";
import { CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useFetchList from "../../hooks/useFetchList";
import { TryoutProps } from "../../types/tryout.type";
import dayjs from "dayjs";
import { apiCreateTryout, apiDeleteTryout } from "../../api/tryout";
import type { DatePickerProps, GetProps } from "antd";
import { getErrorMessage } from "../../helpers/errorHandler";
import copy from "copy-to-clipboard";
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { Title } = Typography;

const { Text, Link } = Typography;

const ListTryout = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { data: tryoutData, fetchList } = useFetchList<TryoutProps>({
    endpoint: "tryout",
  });

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (tryoutId: string) => {
    await apiDeleteTryout(tryoutId);
    fetchList();
    message.success("Success Delete");
  };

  const columns: TableProps<TryoutProps>["columns"] = [
    {
      title: "Tryout",
      dataIndex: "tryout",
      key: "tryout",
      render: (_, record) => (
        <Link
          underline
          onClick={() => navigate("/tryout/" + record.tryout_id + "/edit")}
        >
          {record.title}
        </Link>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (_, record) => <Text>{record.duration + " Minutes"}</Text>,
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      render: (_, { start_time }) => (
        <Text>{formatDateToCustomString(start_time)}</Text>
      ),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      render: (_, { end_time }) => (
        <Text>{formatDateToCustomString(end_time)}</Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (_, { start_time, end_time }) => (
        <Tag color={statusColor(checkStatus(start_time, end_time))}>
          {checkStatus(start_time, end_time)}
        </Tag>
      ),
    },
    {
      title: "Token",
      key: "token",
      dataIndex: "token",
      render: (_, record) => (
        <div>
          <Input.Password
            disabled={!record.token}
            style={{ width: 100 }}
            value={record.token}
          />
          <CopyOutlined
            onClick={() => {
              if (copy(record.token)) {
                message.success("Token has been copied!");
              }
            }}
            style={{ marginLeft: 10, color: "grey" }}
          />
        </div>
      ),
    },
    // {
    //   title: "Action",
    //   key: "action",
    //   dataIndex: "action",
    //   render: (_, record) => (
    //     <DeleteOutlined
    //       onClick={() => handleDelete(record.tryout_id)}
    //       style={{ color: "red" }}
    //     />
    //   ),
    // },
  ];

  function formatDateToCustomString(date: any) {
    return dayjs(date).locale("id").format("DD MMMM YYYY HH:mm");
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

  const checkStatus = (startTime: Date | string, endTime: Date | string) => {
    if (new Date(startTime) < new Date() && new Date(endTime) > new Date()) {
      return "ON GOING";
    } else if (new Date(startTime) > new Date()) {
      return "IN COMING";
    } else if (new Date(endTime) < new Date()) {
      return "FINISHED";
    } else {
      return "UNKNOWN";
    }
  };

  const handleCreate = async (data: any) => {
    const res = await apiCreateTryout(data);
    if (res) {
      setShowModal(false);
      fetchList();
      message.success("Create Tryout Success");
    }
  };
  const onFinishFailed = (errorInfo: any) => {
    message.error(getErrorMessage(errorInfo));
  };

  const onChange = (
    value: DatePickerProps["value"] | RangePickerProps["value"],
    dateString: [string, string] | string
  ) => {
    console.log("Selected Time: ", value);
    console.log("Formatted Selected Time: ", dateString);
  };

  const onOk = (
    value: DatePickerProps["value"] | RangePickerProps["value"]
  ) => {
    console.log("onOk: ", value);
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
          marginBottom: 20,
          color: "white",
          backgroundColor: "#04073B",
        }}
        onClick={() => setShowModal(true)}
      >
        <PlusOutlined />
        Create Tryout
      </Button>
      <Table columns={columns} dataSource={tryoutData} />

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={false}
      >
        <Title level={3} style={{ fontWeight: "bold" }}>
          Create Tryout
        </Title>
        <Form
          name="createTryout"
          onFinish={handleCreate}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Form.Item
            label="Tryout Name"
            name="title"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Duration (Minutes)"
            name="duration"
            rules={[{ required: true }]}
          >
            <InputNumber />
          </Form.Item>

          <Form.Item
            label="Start Time"
            name="start_time"
            rules={[{ required: true }]}
          >
            <DatePicker showTime onChange={onChange} onOk={onOk} />
          </Form.Item>

          <Form.Item
            label="End Time"
            name="end_time"
            rules={[{ required: true }]}
          >
            <DatePicker showTime onChange={onChange} onOk={onOk} />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListTryout;
