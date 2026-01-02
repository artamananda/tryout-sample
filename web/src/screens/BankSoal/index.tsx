import { useEffect, useState } from 'react';
import { Navigation } from '../../components/Home/Navigation';
import {
  Layout,
  Row,
  Col,
  Card,
  Input,
  Typography,
  Select,
  Tag,
  Collapse,
  Spin,
  Empty,
  Radio,
  Divider
} from 'antd';
import {
  BookOutlined,
  QuestionCircleOutlined,
  FilterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import useFetchList from '../../hooks/useFetchList';
import { QuestionProps } from '../../types/question';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;
const { Panel } = Collapse;

const QUESTION_TYPES = [
  { value: '', label: 'Semua Jenis' },
  { value: 'kpu', label: 'Penalaran Umum (KPU)' },
  { value: 'ppu', label: 'Pengetahuan dan Pemahaman Umum (PPU)' },
  { value: 'pbm', label: 'Pemahaman Bacaan dan Menulis (PBM)' },
  { value: 'pku', label: 'Pengetahuan Kuantitatif (PKU)' },
  { value: 'ind', label: 'Literasi Bahasa Indonesia (IND)' },
  { value: 'ing', label: 'Literasi Bahasa Inggris (ING)' },
  { value: 'mtk', label: 'Penalaran Matematika (MTK)' }
];

const getQuestionTypeName = (code: string) => {
  const type = QUESTION_TYPES.find((t) => t.value === code);
  return type ? type.label : code.toUpperCase();
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    kpu: 'blue',
    ppu: 'green',
    pbm: 'purple',
    pku: 'orange',
    ind: 'red',
    ing: 'cyan',
    mtk: 'magenta'
  };
  return colors[type] || 'default';
};

const BankSoalScreen = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

  const {
    data: questions,
    setSearch,
    isLoading,
    setQuery,
    query
  } = useFetchList<QuestionProps>({
    endpoint: 'question'
  });

  useEffect(() => {
    document.title = 'Bank Soal - Telisik';
  }, []);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedType && q.type !== selectedType) return false;
    return true;
  });

  const toggleAnswer = (questionId: string) => {
    setShowAnswer((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navigation />
      <div
        style={{
          padding: '40px 24px',
          maxWidth: 1200,
          margin: '0 auto',
          marginTop: 80
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <Title level={2}>
            <BookOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            Bank Soal
          </Title>
          <Paragraph
            type="secondary"
            style={{ maxWidth: 600, margin: '0 auto' }}
          >
            Jelajahi koleksi soal-soal latihan untuk mempersiapkan ujian Anda.
            Latih kemampuan Anda dengan berbagai jenis soal!
          </Paragraph>
        </div>

        {/* Filter Section */}
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Search
                placeholder="Cari soal berdasarkan kata kunci..."
                enterButton="Cari"
                size="large"
                onSearch={(value) => setSearch(value)}
                prefix={<QuestionCircleOutlined />}
              />
            </Col>
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FilterOutlined style={{ color: '#1890ff' }} />
                <Text strong>Jenis Soal:</Text>
                <Select
                  style={{ flex: 1 }}
                  size="large"
                  value={selectedType}
                  onChange={handleTypeChange}
                  options={QUESTION_TYPES}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Stats Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card
              style={{
                textAlign: 'center',
                borderRadius: 12,
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff'
              }}
            >
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {filteredQuestions.length}
              </Title>
              <Text type="secondary">Total Soal</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                textAlign: 'center',
                borderRadius: 12,
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f'
              }}
            >
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {QUESTION_TYPES.length - 1}
              </Title>
              <Text type="secondary">Jenis Soal</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                textAlign: 'center',
                borderRadius: 12,
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591'
              }}
            >
              <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                Gratis
              </Title>
              <Text type="secondary">Akses Penuh</Text>
            </Card>
          </Col>
        </Row>

        {/* Questions List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: 100 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>
              <Text type="secondary">Memuat bank soal...</Text>
            </p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 100 }}>
            <Empty
              description="Tidak ada soal yang ditemukan. Coba kata kunci atau filter lain."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredQuestions.map((question, index) => (
              <Card
                key={question.question_id}
                hoverable
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border:
                    expandedQuestion === question.question_id
                      ? '2px solid #1890ff'
                      : '1px solid #f0f0f0'
                }}
                onClick={() =>
                  setExpandedQuestion(
                    expandedQuestion === question.question_id
                      ? null
                      : question.question_id
                  )
                }
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12
                  }}
                >
                  <Tag color={getTypeColor(question.type)}>
                    {getQuestionTypeName(question.type)}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{index + 1}
                  </Text>
                </div>

                <Title level={5} style={{ marginBottom: 16 }}>
                  {question.text}
                </Title>

                {question.image_url && (
                  <div style={{ marginBottom: 16, textAlign: 'center' }}>
                    <img
                      src={question.image_url}
                      alt="Question"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 8
                      }}
                    />
                  </div>
                )}

                {question.options && question.options.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Radio.Group
                      style={{ width: '100%' }}
                      value={
                        showAnswer[question.question_id]
                          ? question.correct_answer
                          : null
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8
                        }}
                      >
                        {question.options.map((option, optIndex) => {
                          const optionLetter = String.fromCharCode(
                            65 + optIndex
                          );
                          const isCorrect =
                            question.correct_answer === optionLetter ||
                            option.startsWith(question.correct_answer);
                          const shouldHighlight =
                            showAnswer[question.question_id] && isCorrect;

                          return (
                            <div
                              key={optIndex}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                backgroundColor: shouldHighlight
                                  ? '#f6ffed'
                                  : '#fafafa',
                                border: shouldHighlight
                                  ? '1px solid #52c41a'
                                  : '1px solid #e8e8e8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                              }}
                            >
                              <Radio value={optionLetter} disabled>
                                {option}
                              </Radio>
                              {shouldHighlight && (
                                <CheckCircleOutlined
                                  style={{ color: '#52c41a' }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Radio.Group>
                  </div>
                )}

                <Divider style={{ margin: '12px 0' }} />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text
                    type="secondary"
                    style={{ fontSize: 12 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAnswer(question.question_id);
                    }}
                  >
                    {showAnswer[question.question_id] ? (
                      <span style={{ color: '#52c41a', cursor: 'pointer' }}>
                        <CheckCircleOutlined /> Sembunyikan Jawaban
                      </span>
                    ) : (
                      <span style={{ color: '#1890ff', cursor: 'pointer' }}>
                        👁 Lihat Jawaban
                      </span>
                    )}
                  </Text>
                  {question.points && (
                    <Tag color="gold">{question.points} Poin</Tag>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BankSoalScreen;
