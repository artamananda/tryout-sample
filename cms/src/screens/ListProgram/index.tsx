import { Avatar, Badge, Image, Table, Typography } from "antd";
import useFetchList from "../../hooks/useFetchList";
import { useEffect } from "react";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Link } = Typography;

const ListProgramScreen = () => {
  const {
    data: programData,
    fetchList,
    isLoading,
  } = useFetchList<any>({
    endpoint: "transaction-program",
  });

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Foto",
      dataIndex: "picture_url",
      key: "picture_url",
      render: (_: any, record: any) => (
        <div>
          {record.user.picture_url ? (
            <Image src={record.user.picture_url} width={100} />
          ) : (
            <Avatar>{record.user.name[0]}</Avatar>
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (_: any, record: any) => (
        <Link style={{ textDecoration: "underline" }}>{record.user.name}</Link>
      ),
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (_: any, record: any) => <Text>{record.user.email}</Text>,
      width: 300,
    },
    {
      title: "Asal",
      dataIndex: "asal",
      key: "asal",
      render: (_: any, record: any) => (
        <Text>{`${record.user.school} - ${record.user.regency}, ${record.user.province}`}</Text>
      ),
      width: 150,
    },
    {
      title: "Motivasi",
      dataIndex: "motivation",
      key: "motivation",
    },
    {
      title: "Tanggal Terdaftar",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (_: any, record: any) => (
        <Text>
          {dayjs(record.created_at).locale("id").format("D MMM YYYY HH:mm")}
        </Text>
      ),
    },
  ];

  useEffect(() => {
    fetchList();
  }, []);
  return (
    <div>
      <div
        style={{
          flexDirection: "row",
          display: "flex",
          marginBlock: 30,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: "bold" }}>
          Calon Siswa Telisik
        </div>
        <Badge count={programData.length} />
      </div>
      <Table
        dataSource={programData}
        columns={columns}
        pagination={false}
        loading={isLoading}
      />
    </div>
  );
};

export default ListProgramScreen;
