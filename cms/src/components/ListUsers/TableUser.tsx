import { useState } from "react";
import { Avatar, Button, Card, Dropdown, Grid, Input, Modal, Radio, Select, Space, Table, Tag, Typography, message } from "antd";
import type { TableProps } from "antd";
import { MoreOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useFetchList from "../../hooks/useFetchList";
import { UserProps } from "../../types/user.type";
import UserBadges from "../kit/UserBadges";
import UserName, { forgetUserBadges } from "../kit/UserName";
import { VERIFIED_LABELS } from "../../types/badge.type";
import { apiRemoveVerification, apiSetVerification } from "../../api/user";
import { getErrorMessage } from "../../helpers/errorHandler";

const { Text, Link } = Typography;

const formatDate = (date?: Date | string) =>
  !date || date === "0001-01-01T00:00:00Z" ? "-" : dayjs(date).locale("id").format("DD MMM YYYY HH:mm");

/**
 * Users of one role. Columns keep a fixed width and the table scrolls
 * sideways, so names stay readable on any screen.
 */
const TableUser = (props: { role?: string }) => {
  const isParticipantList = props.role !== "admin";
  // On phones a pinned name column would fill the screen; let it scroll too.
  const screens = Grid.useBreakpoint();
  const pinName = Boolean(screens.md);
  const { data, setData, setSearch, setQuery, isLoading } = useFetchList<UserProps>({
    endpoint: "user",
    initialQuery: { role: props.role },
  });

  const [verifying, setVerifying] = useState<UserProps>();
  const [label, setLabel] = useState<string>("tutor");
  const [saving, setSaving] = useState(false);

  // Replace one row with the user the API sent back after a badge change.
  const replaceUser = (updated: UserProps) => {
    forgetUserBadges(updated.user_id);
    setData((rows) => rows.map((row) => (row.user_id === updated.user_id ? { ...row, ...updated } : row)));
  };

  const openVerification = (user: UserProps) => {
    setLabel(user.badges?.verified?.label || "tutor");
    setVerifying(user);
  };

  const saveVerification = async () => {
    if (!verifying) return;
    setSaving(true);
    try {
      replaceUser(await apiSetVerification(verifying.user_id, label));
      message.success(`${verifying.name} sekarang terverifikasi.`);
      setVerifying(undefined);
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeVerification = (user: UserProps) =>
    Modal.confirm({
      title: "Cabut centang biru?",
      content: `${user.name} tidak lagi tampil sebagai ${user.badges?.verified?.label_name || "terverifikasi"}.`,
      okText: "Cabut",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => {
        try {
          replaceUser(await apiRemoveVerification(user.user_id));
          message.success(`Centang biru ${user.name} dicabut.`);
        } catch (err) {
          message.error(getErrorMessage(err));
        }
      },
    });

  type Columns = NonNullable<TableProps<UserProps>["columns"]>;

  const columns: Columns = [
    {
      title: "Nama",
      key: "name",
      width: 280,
      fixed: pinName ? "left" : undefined,
      render: (_, record) => (
        <Space size={10}>
          <Avatar size={36} src={record.picture_url || undefined} icon={<UserOutlined />} style={{ background: "#2563eb", flex: "none" }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ maxWidth: 200 }}>
              <UserName userId={record.user_id} name={record.name} badges={record.badges} showPackage={false} />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              @{record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Lencana",
      key: "badges",
      width: 220,
      render: (_, record) =>
        record.badges?.package || record.badges?.profile_complete ? (
          <UserBadges badges={record.badges} hideVerified compact />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 260,
      ellipsis: true,
    },
    {
      title: "WhatsApp",
      dataIndex: "phone_number",
      key: "phone_number",
      width: 170,
      render: (_, { phone_number }) =>
        phone_number ? (
          <Link href={`https://wa.me/${phone_number}`} target="_blank" rel="noreferrer">
            {phone_number}
          </Link>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    ...(isParticipantList
      ? ([
          {
            title: "Pendidikan",
            key: "last_education",
            width: 220,
            ellipsis: true,
            render: (_, { last_education, major }) =>
              last_education ? `${last_education}${major ? ` - ${major}` : ""}` : <Text type="secondary">-</Text>,
          },
          {
            title: "Target Instansi",
            dataIndex: "target_agency",
            key: "target_agency",
            width: 220,
            ellipsis: true,
            render: (value: string) => value || <Text type="secondary">-</Text>,
          },
          {
            title: "Domisili",
            key: "regency",
            width: 220,
            ellipsis: true,
            render: (_, { regency, province }) =>
              regency || province ? [regency, province].filter(Boolean).join(", ") : <Text type="secondary">-</Text>,
          },
        ] as Columns)
      : ([
          {
            title: "Role",
            dataIndex: "role",
            key: "role",
            width: 120,
            render: (role: string) => <Tag>{role.toUpperCase()}</Tag>,
          },
        ] as Columns)),
    {
      title: "Terdaftar",
      key: "created_at",
      width: 170,
      render: (_, { created_at }) => formatDate(created_at),
    },
    {
      title: "Login Terakhir",
      key: "last_login",
      width: 170,
      render: (_, { last_login }) => formatDate(last_login),
    },
    {
      title: "",
      key: "more",
      width: 56,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: record.badges?.verified
              ? [
                  { key: "change", label: "Ubah keterangan centang biru" },
                  { key: "remove", label: "Cabut centang biru", danger: true },
                ]
              : [{ key: "verify", label: "Beri centang biru" }],
            onClick: ({ key }) => (key === "remove" ? removeVerification(record) : openVerification(record)),
          }}
        >
          <Button type="text" icon={<MoreOutlined />} aria-label={`Aksi untuk ${record.name}`} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Card className="tl-card" bodyStyle={{ padding: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 16 }}>
        <Input.Search
          placeholder="Cari nama"
          onSearch={(value) => setSearch(value)}
          allowClear
          style={{ flex: "1 1 260px", maxWidth: 360 }}
        />
        <Select
          style={{ width: 200 }}
          defaultValue=""
          onChange={(value: string) => setQuery((query: any) => ({ ...query, verified: value || undefined }))}
          options={[
            { value: "", label: "Semua" },
            { value: "true", label: "Terverifikasi" },
            { value: "false", label: "Belum terverifikasi" },
          ]}
        />
      </div>
      <Table
        rowKey="user_id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => `${total} akun` }}
      />

      <Modal
        title="Centang biru"
        open={Boolean(verifying)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={saving}
        onOk={saveVerification}
        onCancel={() => setVerifying(undefined)}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Text>
            Berikan centang biru kepada <b>{verifying?.name}</b>. Keterangannya hanya terlihat saat orang mengarahkan
            kursor ke centang.
          </Text>
          <Radio.Group value={label} onChange={(event) => setLabel(event.target.value)}>
            <Space direction="vertical">
              {VERIFIED_LABELS.map((item) => (
                <Radio key={item.value} value={item.value}>
                  {item.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Space>
      </Modal>
    </Card>
  );
};

export default TableUser;
