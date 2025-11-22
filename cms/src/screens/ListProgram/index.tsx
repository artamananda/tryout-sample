import { Button, Card, Col, Row, Spin, Typography } from "antd";
import useFetchList from "../../hooks/useFetchList";
import { ProgramProps } from "../../types/program.type";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const ListProgramScreen = () => {
  const { data: programData, isLoading } = useFetchList<ProgramProps>({
    endpoint: "program",
  });

  return isLoading ? (
    <Spin />
  ) : (
    <div>
      <Row>
        {programData?.map((program: ProgramProps) => (
          <Col span={24} key={program.program_id}>
            <CardProgram record={program} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

const CardProgram = ({ record }: { record: ProgramProps }) => {
  return (
    <Card>
      <Title level={4}>{`${record.name}`}</Title>
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

      <div
        style={{ marginTop: 16, display: "flex", flexDirection: "row", gap: 8 }}
      >
        <Button type="primary">Peserta Terdaftar</Button>
        <Button>Edit</Button>
      </div>
    </Card>
  );
};

export default ListProgramScreen;
