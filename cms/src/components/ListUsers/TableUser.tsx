import { useEffect } from "react";
import { Button, Dropdown, Input, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import type { TableProps } from "antd";
import { CheckCircleFilled, DownOutlined } from "@ant-design/icons";
import UserBadges, { VerifiedMark } from "../kit/UserBadges";
import { VERIFIED_LABELS } from "../../types/badge.type";
import { apiRemoveVerification, apiSetVerification } from "../../api/user";
import { getErrorMessage } from "../../helpers/errorHandler";
import useFetchList from "../../hooks/useFetchList";
import dayjs from "dayjs";
import { UserProps } from "../../types/user.type";

const { Text, Link } = Typography;

const TableUser = (props: { role?: string }) => {
  const {
    data: tryoutData,
    setData,
    fetchList,
    search,
    setSearch,
    setQuery,
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

  // Replace one row with the user the API sent back after a badge change.
  const replaceUser = (updated: UserProps) =>
    setData((rows) => rows.map((row) => (row.user_id === updated.user_id ? { ...row, ...updated } : row)));

  const verify = async (user: UserProps, label: string) => {
    try {
      replaceUser(await apiSetVerification(user.user_id, label));
      message.success(`${user.name} sekarang terverifikasi.`);
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const unverify = async (user: UserProps) => {
    try {
      replaceUser(await apiRemoveVerification(user.user_id));
      message.success(`Centang biru ${user.name} dicabut.`);
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const columns: TableProps<UserProps>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Text strong>
          {record.name}
          <VerifiedMark badges={record.badges} />
        </Text>
      ),
    },
    {
      title: "Lencana",
      key: "badges",
      render: (_, record) =>
        record.badges?.verified || record.badges?.package || record.badges?.profile_complete ? (
          <UserBadges badges={record.badges} />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Centang Biru",
      key: "verification",
      render: (_, record) =>
        record.badges?.verified ? (
          <Popconfirm
            title="Cabut centang biru?"
            description={`${record.name} tidak lagi tampil sebagai ${record.badges.verified.label_name}.`}
            okText="Cabut"
            cancelText="Batal"
            onConfirm={() => unverify(record)}
          >
            <Button size="small" danger>
              Cabut
            </Button>
          </Popconfirm>
        ) : (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: VERIFIED_LABELS.map((item) => ({ key: item.value, label: item.label })),
              onClick: ({ key }) => verify(record, key),
            }}
          >
            <Button size="small" icon={<CheckCircleFilled style={{ color: "#1d9bf0" }} />}>
              Verifikasi <DownOutlined />
            </Button>
          </Dropdown>
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
      <Space wrap style={{ marginBottom: 12, width: "100%" }}>
        <Input.Search onSearch={(e) => setSearch(e)} allowClear style={{ minWidth: 260 }} />
        <Select
          style={{ width: 200 }}
          defaultValue=""
          onChange={(value: string) => setQuery((query: any) => ({ ...query, verified: value || undefined }))}
          options={[
            { value: "", label: "Semua user" },
            { value: "true", label: "Terverifikasi" },
            { value: "false", label: "Belum terverifikasi" },
          ]}
        />
      </Space>
      <Table rowKey="user_id" columns={columns} dataSource={tryoutData} loading={isLoading} scroll={{ x: true }} />
    </div>
  );
};

export default TableUser;
