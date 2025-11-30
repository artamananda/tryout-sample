import { Card, Col, Row, Tag, Typography, Button, Spin } from 'antd';
import useFetchList from '../../hooks/useFetchList';
import { ProgramProps } from '../../types/program.type';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/default-image.jpg';

const { Title, Text } = Typography;

const ProgramScreen = () => {
  const navigate = useNavigate();
  const { data: programData, isLoading } = useFetchList<ProgramProps>({
    endpoint: 'program'
  });

  return (
    <div style={{ padding: 16 }}>
      {isLoading ? (
        <Spin />
      ) : programData && programData.length > 0 ? (
        <>
          <Title level={3} style={{ marginBottom: 24 }}>
            Program yang Sedang Dibuka
          </Title>
          <Row gutter={[24, 24]}>
            {programData?.map((program) => (
              <Col xs={24} sm={12} md={8} key={program.program_id}>
                <ProgramCard record={program} navigate={navigate} />
              </Col>
            ))}
          </Row>
        </>
      ) : (
        <Text>Belum ada program yang tersedia saat ini.</Text>
      )}
    </div>
  );
};

const ProgramCard = ({
  record,
  navigate
}: {
  record: ProgramProps;
  navigate: any;
}) => {
  const isOpen =
    dayjs().isAfter(dayjs(record.open_registration)) &&
    dayjs().isBefore(dayjs(record.close_registration));

  const isNotYetOpen = dayjs().isBefore(dayjs(record.open_registration));

  return (
    <Card
      hoverable
      cover={
        <div
          style={{
            height: 160,
            backgroundImage: `url(${record.picture_url || logo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      }
      style={{ borderRadius: 12 }}
    >
      <Title level={4}>{record.name}</Title>

      <div style={{ marginBottom: 8 }}>
        {isOpen ? (
          <Tag color="green">Pendaftaran Dibuka</Tag>
        ) : isNotYetOpen ? (
          <Tag color="blue">Pendaftaran Belum Dibuka</Tag>
        ) : (
          <Tag color="red">Pendaftaran Ditutup</Tag>
        )}
      </div>

      <Text type="secondary">{record.description}</Text>

      <div style={{ marginTop: 12 }}>
        <Text strong>Pendaftaran:</Text>
        <br />
        <Text>
          {dayjs(record.open_registration).format('DD MMM YYYY')} -{' '}
          {dayjs(record.close_registration).format('DD MMM YYYY')}
        </Text>
      </div>

      <div style={{ marginTop: 12 }}>
        <Text strong>Pelaksanaan:</Text>
        <br />
        <Text>
          {dayjs(record.start_time).format('DD MMM YYYY')} -{' '}
          {dayjs(record.end_time).format('DD MMM YYYY')}
        </Text>
      </div>

      <Button
        type="primary"
        block
        style={{ marginTop: 16 }}
        disabled={!isOpen}
        onClick={() => navigate(`/program/${record.program_id}/register`)}
      >
        {isOpen ? 'Daftar Sekarang' : 'Lihat Detail'}
      </Button>
    </Card>
  );
};

export default ProgramScreen;
