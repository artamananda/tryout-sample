import { Avatar, Image, Input, Table, Typography } from "antd";
import useFetchList from "../../../hooks/useFetchList";
import { useEffect } from "react";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";

const { Text, Link } = Typography;

const ListProgramStudentScreen = () => {
  const { programId } = useParams();
  const {
    data: programData,
    fetchList,
    isLoading,
    setSearch,
  } = useFetchList<any>({
    endpoint: "transaction-program",
    initialQuery: {
      program_id: programId,
    },
  });

  const columns = [
    // {
    //   title: "No",
    //   dataIndex: "no",
    //   key: "no",
    //   render: (_: any, __: any, index: number) => index + 1,
    // },
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

          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: "bold" }}>
          Calon Siswa Telisik
        </div>
        <div
          style={{
            backgroundColor: "red",
            borderRadius: "50%",
            color: "white",
            margin: 10,
            padding: 10,
            fontWeight: "bold",
          }}
        >
          {programData?.length || 0}
        </div>
      </div>
      <Input.Search
        style={{ marginBlock: 30 }}
        onSearch={setSearch}
        allowClear
      />
      <Table
        dataSource={programData}
        columns={columns}
        // pagination={false}
        loading={isLoading}
      />
    </div>
  );
};

export default ListProgramStudentScreen;
