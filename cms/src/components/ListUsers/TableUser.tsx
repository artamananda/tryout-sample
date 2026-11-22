import { useEffect } from "react";
import { Input, Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import useFetchList from "../../hooks/useFetchList";
import dayjs from "dayjs";
import { UserProps } from "../../types/user.type";

const { Text, Link } = Typography;

const TableUser = (props: { role?: string }) => {
  const {
    data: tryoutData,
    fetchList,
    search,
    setSearch,
    isLoading,
  } = useFetchList<UserProps>({
    endpoint: "user",
    initialQuery: { role: props.role },
  });

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
      title: "WhatsApp",
      dataIndex: "phone_number",
      key: "phone_number",
      render: (_, { phone_number }) =>
        phone_number ? (
          <Link href={`https://wa.me/${phone_number}`} target="_blank" rel="noreferrer">
            {phone_number}
          </Link>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Pendidikan",
      dataIndex: "last_education",
      key: "last_education",
      render: (_, { last_education, major }) =>
        last_education ? (
          <Text>
            {last_education}
            {major ? ` - ${major}` : ""}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Target Instansi",
      dataIndex: "target_agency",
      key: "target_agency",
      render: (_, { target_agency }) => <Text>{target_agency || "-"}</Text>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (_, { created_at }) => (
        <Text>{formatDateToCustomString(created_at)}</Text>
      ),
    },
    {
      title: "Last Login At",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (_, { last_login }) => (
        <Text>{formatDateToCustomString(last_login)}</Text>
      ),
    },
  ];

  function formatDateToCustomString(date: any) {
    if(date === "0001-01-01T00:00:00Z"){
      return "-"
    }
    return dayjs(date).locale("id").format("DD MMMM YYYY HH:mm");
  }

  return (
    <div>
      <Input.Search onSearch={(e) => setSearch(e)} allowClear />
      <Table columns={columns} dataSource={tryoutData} loading={isLoading} />
    </div>
  );
};

export default TableUser;
