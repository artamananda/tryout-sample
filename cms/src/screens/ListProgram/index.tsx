import { Image, Table, Typography } from "antd";
import useFetchList from "../../hooks/useFetchList";
import { useEffect } from "react";

const { Text } = Typography;

const ListProgramScreen = () => {
  const { data: programData, fetchList } = useFetchList<any>({
    endpoint: "transaction-program",
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_: any, record: any) => <Text>{record.user.name}</Text>,
    },
    {
      title: "Photo",
      dataIndex: "picture_url",
      key: "picture_url",
      render: (_: any, record: any) => (
        <div>
          <Image
            src={
              "https://pub-007d430c70f245248a9ac93600ab2b1a.r2.dev/users/9cc4e2d3-0d7b-49ea-ae0a-179edb6b1aab.jpg"
            }
          />
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (_: any, record: any) => <Text>{record.user.email}</Text>,
    },
    {
      title: "Motivation",
      dataIndex: "motivation",
      key: "motivation",
    },
  ];

  useEffect(() => {
    fetchList();
  }, []);
  return (
    <div>
      <h1>List Program</h1>
      <Table dataSource={programData} columns={columns} />
    </div>
  );
};

export default ListProgramScreen;
