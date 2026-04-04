import { Card, Col, Row, Spin, Statistic, Table, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMyTryoutResult } from '../../api/tryoutResult';
import { UserTryoutResultDetail } from '../../types/tryoutResult';

const { Title, Text } = Typography;

type ScoreRow = {
  key: string;
  subtest: string;
  score: number;
};

const MyTryoutScoreScreen = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<UserTryoutResultDetail | null>(null);

  useEffect(() => {
    const fetchMyScore = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const res = await getMyTryoutResult(id);
      if (res?.data?.payload?.results?.[0]) {
        setResult(res.data.payload.results[0]);
      }
      setIsLoading(false);
    };

    fetchMyScore();
  }, [id]);

  const scoreRows: ScoreRow[] = useMemo(() => {
    const entries = Object.entries(result?.subtest_scores || {});
    return entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subtest, score]) => ({
        key: subtest,
        subtest: subtest.toUpperCase(),
        score
      }));
  }, [result]);

  const columns = [
    {
      title: 'Subtest',
      dataIndex: 'subtest',
      key: 'subtest',
      render: (value: string) => <Text strong>{value}</Text>
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (value: number) => <Text>{value}</Text>
    }
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>Detail Skor Tryout</Title>
      <Text type="secondary">Menampilkan skor kamu saja.</Text>

      <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="Total Score" value={result?.total_score || 0} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Average Score"
              value={result?.avg_score || 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={scoreRows}
        columns={columns}
        pagination={false}
        locale={{ emptyText: 'Skor belum tersedia.' }}
      />
    </div>
  );
};

export default MyTryoutScoreScreen;
