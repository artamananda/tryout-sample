import { useEffect } from "react";
import { Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import useFetchList from "../../hooks/useFetchList";
import dayjs from "dayjs";
import { UserProps } from "../../types/user.type";

const { Text, Link } = Typography;

const TableUser = (props: { role?: string }) => {
  const { data: tryoutData, fetchList } = useFetchList<UserProps>({
    endpoint: "user",
    initialQuery: { role: props.role },
  });

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableProps<UserProps>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Link
          underline
          //   onClick={() => navigate("/tryout-result/" + record.tryout_id)}
        >
          {record.name}
        </Link>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (_, record) => <Text>{record.username}</Text>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (_, record) => <Tag>{record.role.toUpperCase()}</Tag>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (_, record) => <Text>{record.email}</Text>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (_, { created_at }) => (
        <Text>{formatDateToCustomString(created_at)}</Text>
      ),
    },
  ];

  function formatDateToCustomString(date: any) {
    return dayjs(date).locale("id").format("DD MMMM YYYY HH:mm");
  }

  return (
    <div>
      <Table columns={columns} dataSource={tryoutData} />
    </div>
  );
};

export default TableUser;
