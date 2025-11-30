import { Button, Card, Col, Row, Spin, Tag, Typography } from "antd";
import useFetchList from "../../hooks/useFetchList";
import { ProgramProps } from "../../types/program.type";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

const ListProgramScreen = () => {
  const navigate = useNavigate();
  const { data: programData, isLoading } = useFetchList<ProgramProps>({
    endpoint: "program",
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2}>Daftar Program</Title>
        <Button type="primary" onClick={() => navigate("/program/add")}>
          Buat Program Baru
        </Button>
      </div>
      {isLoading ? (
        <Spin />
      ) : (
        <Row gutter={[0, 16]}>
          {programData?.map((program: ProgramProps) => (
            <Col span={24} key={program.program_id}>
              <CardProgram record={program} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

const CardProgram = ({ record }: { record: ProgramProps }) => {
  const navigate = useNavigate();
  return (
    <Card>
      <div
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <div
          style={{ fontWeight: "bold", fontSize: 24 }}
        >{`${record.name}`}</div>
        {record.is_published ? (
          <Tag color="green" style={{ marginLeft: 16, height: 24 }}>
            Published
          </Tag>
        ) : (
          <Tag color="red" style={{ marginLeft: 16, height: 24 }}>
            Unpublished
          </Tag>
        )}
      </div>
      <Text>{record.description}</Text>

      <Text style={{ display: "block", marginTop: 8 }}>
        Pendaftaran:{" "}
        {`${dayjs(record.open_registration).format("DD MMM YYYY")} - ${dayjs(
          record.close_registration
        ).format("DD MMM YYYY")}`}
      </Text>

      <Text>
        Pelaksanaan:{" "}
        {`${dayjs(record.start_time).format("DD MMM YYYY")} - ${dayjs(
          record.end_time
        ).format("DD MMM YYYY")}`}
      </Text>

      <div>
        <Text>Maksimal Peserta: {record.max_participants} orang</Text>
      </div>

      <div
        style={{ marginTop: 16, display: "flex", flexDirection: "row", gap: 8 }}
      >
        <Button
          type="primary"
          onClick={() => navigate(`${record.program_id}/students`)}
        >
          Peserta Terdaftar
        </Button>
        <Button onClick={() => navigate(`${record.program_id}/edit`)}>
          Edit
        </Button>
      </div>
    </Card>
  );
};

export default ListProgramScreen;
