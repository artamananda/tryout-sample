import { useEffect } from "react";
import { Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import useFetchList from "../../hooks/useFetchList";
import { TryoutProps } from "../../types/tryout.type";
import dayjs from "dayjs";

const { Text, Link } = Typography;

const TryOutResultScreen = () => {
  const navigate = useNavigate();
  const { data: tryoutData, fetchList } = useFetchList<TryoutProps>({
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
          onClick={() => navigate("/tryout-result/" + record.tryout_id)}
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

  return (
    <div>
      <Table columns={columns} dataSource={tryoutData} />
    </div>
  );
};

export default TryOutResultScreen;
