import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Typography,
  DatePicker,
  Button,
  message,
  Input,
  Modal,
} from "antd";
import type { TableProps } from "antd";
import { DeleteOutlined, EditFilled, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useFetchList from "../../hooks/useFetchList";
import { TryoutProps } from "../../types/tryout.type";
import dayjs from "dayjs";
import type { DatePickerProps, GetProps } from "antd";
import { getErrorMessage } from "../../helpers/errorHandler";
import copy from "copy-to-clipboard";
import SwitchButton from "../Ui/SwitchButton";
import ModalCreateTryout from "./ModalCreateTryout";
import ModalUpdateTryout from "./ModalUpdateTryout";
import ModalDeleteTryout from "./ModalDeleteTryout";
import { apiUpdateTryout } from "../../api/tryout";
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { Text, Link } = Typography;

const ListTryout = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showModalUpdate, setShowModalUpdate] = useState({
    status: false,
    data: {} as any,
  });
  const [showModalDelete, setShowModalDelete] = useState<any>({
    status: false,
    tryoutId: "",
  });
  const {
    data: tryoutData,
    fetchList,
    isLoading,
  } = useFetchList<TryoutProps>({
    endpoint: "tryout",
  });

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableProps<TryoutProps>["columns"] = [
    {
      title: "Tryout",
      dataIndex: "tryout",
      key: "tryout",
      render: (_, record) => (
        <Link
          underline
          onClick={() => navigate("/tryout/" + record.tryout_id + "/question")}
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
      title: "Published",
      key: "is_published",
      dataIndex: "is_published",
      render: (_, { tryout_id, is_published }) => (
        <SwitchButton
          defaultChecked={is_published}
          onChange={(checked) => {
            handlePublished(tryout_id, checked);
          }}
        />
      ),
    },
    {
      title: "Token",
      key: "token",
      dataIndex: "token",
      render: (_, record) => (
        <div>
          <Input.Password
            readOnly
            style={{ width: 100 }}
            value={record.token}
          />
          <Link
            onClick={() => {
              if (copy(record.token)) {
                message.success("Token has been copied!");
              }
            }}
            style={{ marginLeft: 10 }}
          >
            Copy
          </Link>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            onClick={() => setShowModalUpdate({ status: true, data: record })}
          >
            Edit
          </Link>
          <Link
            onClick={() =>
              setShowModalDelete({ status: true, tryoutId: record.tryout_id })
            }
            style={{ color: "red" }}
          >
            Delete
          </Link>
        </div>
      ),
    },
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

  const handlePublished = async (tryoutId: string, checked: boolean) => {
    try {
      const res = await apiUpdateTryout(tryoutId, { is_published: checked });
      if (res) {
        fetchList();
        message.success("Success Update Published Status");
      }
    } catch (err) {
      message.error("Failed Published");
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    message.error(getErrorMessage(errorInfo));
  };

  const onChange = (
    value: DatePickerProps["value"] | RangePickerProps["value"],
    dateString: [string, string] | string
  ) => {};

  const onOk = (
    value: DatePickerProps["value"] | RangePickerProps["value"]
  ) => {};

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
      <Table columns={columns} dataSource={tryoutData} loading={isLoading} />

      <ModalCreateTryout
        showModal={showModal}
        setShowModal={setShowModal}
        onFinishFailed={onFinishFailed}
        onChange={onChange}
        onOk={onOk}
        fetchList={fetchList}
      />

      <ModalUpdateTryout
        showModalUpdate={showModalUpdate}
        setShowModalUpdate={setShowModalUpdate}
        onFinishFailed={onFinishFailed}
        onChange={onChange}
        onOk={onOk}
        fetchList={fetchList}
      />

      <ModalDeleteTryout
        showModalDelete={showModalDelete}
        setShowModalDelete={setShowModalDelete}
        onFinishFailed={onFinishFailed}
        fetchList={fetchList}
      />
    </div>
  );
};

export default ListTryout;
