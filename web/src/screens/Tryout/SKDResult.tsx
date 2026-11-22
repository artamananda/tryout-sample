import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Progress,
  Result,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography
} from 'antd';
import { ArrowLeftOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getMySKDResult } from '../../api/skd';
import { getErrorMessage } from '../../helpers/errorMessage';
import { SKD_SUBTEST_NAMES, SKDResultProps } from '../../types/skd.type';

const { Title, Text, Paragraph } = Typography;

const SKDResultScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<SKDResultProps>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id) return;
    getMySKDResult(id)
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err, 'Hasil belum tersedia')));
  }, [id]);

  if (error) {
    return (
      <Result
        status="info"
        title="Hasil belum tersedia"
        subTitle={error}
        extra={<Button onClick={() => navigate('/tryout')}>Kembali ke Tryout</Button>}
      />
    );
  }
  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const weakest = SKD_SUBTEST_NAMES[result.weakest_subtest] || result.weakest_subtest.toUpperCase();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/tryout')} style={{ paddingLeft: 0 }}>
          Kembali
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          Hasil {result.title}
        </Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Total Skor SKD" value={result.total_score} suffix={`/ ${result.max_total_score}`} />
            <Tag color={result.passed_all ? 'green' : 'red'} style={{ marginTop: 8 }}>
              {result.passed_all ? 'Memenuhi passing grade' : 'Belum memenuhi passing grade'}
            </Tag>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={result.is_final ? 'Peringkat Nasional' : 'Peringkat Nasional (sementara)'}
              value={result.rank}
              prefix={<TrophyOutlined />}
              suffix={`/ ${result.participants}`}
            />
            {result.province && result.province_rank > 0 && (
              <Text type="secondary">
                {result.province}: {result.province_rank} dari {result.province_participants}
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Subtes Terlemah" value={weakest} valueStyle={{ fontSize: 18 }} />
            <Text type="secondary">Fokuskan latihan di subtes ini.</Text>
          </Card>
        </Col>
      </Row>

      {!result.is_final && (
        <Alert
          type="info"
          showIcon
          message="Peringkat masih sementara"
          description={`Peringkat bisa berubah sampai tryout ditutup pada ${dayjs(result.final_at).format('DD MMM YYYY HH:mm')}. Pembahasan dibuka setelah itu.`}
        />
      )}

      <Card title="Skor per Subtes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {result.subtests.map((subtest) => {
            const percent = subtest.max_score > 0 ? Math.round((subtest.score / subtest.max_score) * 100) : 0;
            // Clamp: a short tryout can have a max score below the passing grade.
            const gradePercent = subtest.max_score > 0 ? Math.min(100, (subtest.passing_grade / subtest.max_score) * 100) : 0;
            return (
              <div key={subtest.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Text strong>
                    {subtest.code.toUpperCase()} · {subtest.name}
                  </Text>
                  <span>
                    <Text strong>{subtest.score}</Text>
                    <Text type="secondary"> / {subtest.max_score} · passing grade {subtest.passing_grade} </Text>
                    <Tag color={subtest.passed ? 'green' : 'red'}>{subtest.passed ? 'Lulus' : 'Belum'}</Tag>
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Progress percent={percent} showInfo={false} status={subtest.passed ? 'success' : 'exception'} />
                  <div
                    title={`Passing grade ${subtest.passing_grade}`}
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: `${gradePercent}%`,
                      width: 2,
                      height: 12,
                      background: 'rgba(0,0,0,0.65)'
                    }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Dijawab {subtest.answered} dari {subtest.questions} soal
                  {subtest.code !== 'tkp' && ` · benar ${subtest.correct} · salah ${subtest.wrong}`}
                </Text>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <Paragraph style={{ marginBottom: 12 }}>
          Garis hitam pada setiap batang menandai passing grade. TWK dan TIU bernilai 5 per jawaban benar, TKP
          bernilai 1–5 per pilihan.
        </Paragraph>
        <Button icon={<BookOutlined />} disabled={!result.is_final} onClick={() => navigate(`/tryout/${result.tryout_id}/pembahasan`)}>
          {result.is_final ? 'Lihat Pembahasan' : 'Pembahasan dibuka setelah tryout ditutup'}
        </Button>
      </Card>
    </div>
  );
};

export default SKDResultScreen;
