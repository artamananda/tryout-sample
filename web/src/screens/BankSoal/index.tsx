import { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Typography,
  Select,
  Tag,
  Spin,
  Empty,
  Divider,
  Button,
  Pagination
} from 'antd';
import {
  QuestionCircleOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  SearchOutlined,
  RobotOutlined,
  RocketOutlined
} from '@ant-design/icons';
import useFetchList from '../../hooks/useFetchList';
import { QuestionProps } from '../../types/question';
import parse from 'html-react-parser';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const { Title, Paragraph, Text } = Typography;

// Known question type labels for display
const KNOWN_TYPE_LABELS: Record<string, string> = {
  kpu: 'Penalaran Umum (KPU)',
  ppu: 'Pengetahuan dan Pemahaman Umum (PPU)',
  pbm: 'Pemahaman Bacaan dan Menulis (PBM)',
  pku: 'Pengetahuan Kuantitatif (PKU)',
  ind: 'Literasi Bahasa Indonesia (IND)',
  ing: 'Literasi Bahasa Inggris (ING)',
  mtk: 'Penalaran Matematika (MTK)'
};

const getQuestionTypeName = (code: string) => {
  return KNOWN_TYPE_LABELS[code] || code.toUpperCase();
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

// Render text that may include LaTeX math between $...$ or $$...$$ using KaTeX.
const renderTextWithMath = (text: string) => {
  if (!text) return null;
  const parts: any[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const idx = match.index;
    if (idx > lastIndex) {
      const plain = text.slice(lastIndex, idx);
      parts.push(parse(plain));
    }

    const mathRaw = match[0];
    const isBlock = mathRaw.startsWith('$$');
    const content = isBlock ? mathRaw.slice(2, -2) : mathRaw.slice(1, -1);
    try {
      const rendered = katex.renderToString(content, {
        throwOnError: false,
        displayMode: isBlock
      });
      parts.push(
        // eslint-disable-next-line react/no-danger
        <span
          key={`${idx}-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: rendered }}
          style={{ margin: isBlock ? '8px 0' : '0 2px' }}
        />
      );
    } catch (err) {
      parts.push(mathRaw);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(parse(text.slice(lastIndex)));
  }

  return parts;
};

const BankSoalScreen = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('newest');

  const {
    data: questions,
    setSearch,
    isLoading,
    search
  } = useFetchList<QuestionProps>({
    endpoint: 'bank-soal'
  });

  useEffect(() => {
    document.title = 'Bank Soal - Telisik';
  }, []);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const dynamicFilterOptions = useMemo(() => {
    const typesFromData = questions.map((q) => q.type);
    const knownTypes = Object.keys(KNOWN_TYPE_LABELS);
    const allTypesArray = [...knownTypes, ...typesFromData];
    const uniqueTypes = Array.from(new Set(allTypesArray));

    const options = [{ value: '', label: 'Semua Jenis' }];
    uniqueTypes.forEach((type) => {
      if (type) {
        options.push({
          value: type,
          label: KNOWN_TYPE_LABELS[type] || type.toUpperCase()
        });
      }
    });
    return options;
  }, [questions]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      if (q.type) counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (selectedType && q.type !== selectedType) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        return 0;
      });
  }, [questions, selectedType, sortBy]);

  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleAnswer = (questionId: string) => {
    setShowAnswer((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: '#fdfbfe',
        paddingBottom: 60
      }}
    >
      {/* Hero Section - unified with Learning Video style */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px', padding: '24px' }}>
        <Col span={24}>
          <Card
            style={{
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <div style={{ padding: '20px 0' }}>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                <RocketOutlined style={{ marginRight: '12px' }} /> Bank Soal
                Telisik
              </Title>
              <Paragraph
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 15,
                  margin: 0
                }}
              >
                Koleksi soal latihan terbaik untuk persiapan ujian yang lebih
                maksimal.
              </Paragraph>
            </div>
          </Card>
        </Col>
      </Row>

      <div
        style={{
          padding: '0 40px',
          width: '100%',
          margin: '-24px auto 0'
        }}
      >
        {/* Filter Section */}
        <Card
          style={{
            marginBottom: 32,
            borderRadius: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: 'none'
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={12}>
              <Input
                placeholder="Cari soal berdasarkan kata kunci..."
                size="large"
                allowClear
                onChange={(e) => setSearch(e.target.value)}
                prefix={<SearchOutlined style={{ color: '#8C59F1' }} />}
                style={{ borderRadius: 12, height: 50 }}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select
                style={{ width: '100%' }}
                size="large"
                value={selectedType}
                onChange={handleTypeChange}
                options={dynamicFilterOptions}
                placeholder="Filter Jenis"
                suffixIcon={<FilterOutlined style={{ color: '#8C59F1' }} />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select
                style={{ width: '100%' }}
                size="large"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'newest', label: 'Terbaru' },
                  { value: 'oldest', label: 'Terlama' }
                ]}
                placeholder="Urutkan"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 16 }}>
            <Col xs={12} sm={8}>
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'white',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  textAlign: 'center'
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block' }}
                >
                  TOTAL SOAL
                </Text>
                <Title level={2} style={{ margin: 0, color: '#8C59F1' }}>
                  {filteredQuestions.length}
                </Title>
              </div>
            </Col>

            <Col xs={12} sm={8}>
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'white',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  textAlign: 'center'
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block' }}
                >
                  JENIS SOAL
                </Text>
                <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>
                  {dynamicFilterOptions.length - 1}
                </Title>
              </div>
            </Col>

            <Col xs={12} sm={8}>
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'white',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  textAlign: 'center'
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block' }}
                >
                  AKSES
                </Text>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  Gratis
                </Title>
              </div>
            </Col>
          </Row>

          {/* Per-subtest counts */}
          <Row
            gutter={[12, 12]}
            style={{ marginBottom: 32, justifyContent: 'center' }}
          >
            {Array.from(
              new Set([
                ...Object.keys(KNOWN_TYPE_LABELS),
                ...Object.keys(typeCounts)
              ])
            ).map((type) => (
              <Col key={type} xs={12} sm={3}>
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: 'white',
                    borderRadius: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: getTypeColor(type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      flexShrink: 0,
                      fontSize: 12
                    }}
                  >
                    {type.toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: 'block',
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {KNOWN_TYPE_LABELS[type] || ''}
                    </Text>
                    <Text strong style={{ fontSize: 14, color: '#262626' }}>
                      {typeCounts[type] || 0} soal
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Questions List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="Memuat bank soal Telisik..." />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card
            style={{ borderRadius: 20, textAlign: 'center', padding: '40px 0' }}
          >
            <Empty
              description={
                <Text type="secondary">Tidak ada soal yang ditemukan.</Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {paginatedQuestions.map((question, index) => (
                <Card
                  key={question.question_id}
                  style={{
                    borderRadius: 24,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden'
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      padding: '16px 24px',
                      backgroundColor: '#fafafa',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                    >
                      <Tag
                        color={getTypeColor(question.type)}
                        style={{
                          borderRadius: 8,
                          padding: '2px 10px',
                          fontWeight: 600,
                          border: 'none'
                        }}
                      >
                        {getQuestionTypeName(question.type)}
                      </Tag>
                      {question.is_ai_generated && (
                        <Tag
                          icon={<RobotOutlined />}
                          color="purple"
                          style={{
                            borderRadius: 8,
                            padding: '2px 10px',
                            fontWeight: 600,
                            border: 'none'
                          }}
                        >
                          Generasi AI
                        </Tag>
                      )}
                    </div>
                    <Text strong style={{ color: '#8C59F1' }}>
                      # {(currentPage - 1) * pageSize + index + 1}
                    </Text>
                  </div>

                  <div style={{ padding: '24px 24px 12px' }}>
                    {/* Question Text with HTML Rendering */}
                    <div
                      className="soal-content"
                      style={{
                        fontSize: 16,
                        lineHeight: 1.6,
                        color: '#262626',
                        marginBottom: 24
                      }}
                    >
                      {renderTextWithMath(question.text || '')}
                    </div>

                    {question.image_url && (
                      <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <img
                          src={question.image_url}
                          alt="Question Visual"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 400,
                            borderRadius: 16,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                      </div>
                    )}

                    {/* Options Grid */}
                    {question.options && question.options.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}
                        >
                          {question.options.map((option, optIndex) => {
                            const optionLetter = String.fromCharCode(
                              65 + optIndex
                            );
                            const isCorrect =
                              question.correct_answer === optionLetter;
                            const isOpen = showAnswer[question.question_id];

                            return (
                              <div
                                key={optIndex}
                                style={{
                                  padding: '16px 20px',
                                  borderRadius: 16,
                                  backgroundColor:
                                    isOpen && isCorrect ? '#f6ffed' : '#f9f9f9',
                                  border:
                                    isOpen && isCorrect
                                      ? '2px solid #52c41a'
                                      : '1px solid #f0f0f0',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 16,
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    backgroundColor:
                                      isOpen && isCorrect ? '#52c41a' : '#fff',
                                    color:
                                      isOpen && isCorrect ? '#fff' : '#8C59F1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    flexShrink: 0,
                                    border:
                                      isOpen && isCorrect
                                        ? 'none'
                                        : '1px solid #e8e8e8'
                                  }}
                                >
                                  {optionLetter}
                                </div>
                                <div
                                  style={{
                                    fontSize: 15,
                                    color: '#434343',
                                    paddingTop: 4
                                  }}
                                >
                                  {parse(option)}
                                </div>
                                {isOpen && isCorrect && (
                                  <CheckCircleOutlined
                                    style={{
                                      color: '#52c41a',
                                      marginLeft: 'auto',
                                      fontSize: 20
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explanation Section */}
                    {showAnswer[question.question_id] &&
                      question.explanation && (
                        <div
                          style={{
                            padding: 20,
                            backgroundColor: '#f9f0ff',
                            borderRadius: 16,
                            borderLeft: '4px solid #8C59F1',
                            marginBottom: 20
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              color: '#8C59F1',
                              marginBottom: 8,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            <BulbOutlined /> Penjelasan
                          </Title>
                          <div style={{ color: '#5939a3' }}>
                            {parse(question.explanation)}
                          </div>
                        </div>
                      )}

                    {/* Footer Actions */}
                    <Divider style={{ margin: '16px 0' }} />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: 12
                      }}
                    >
                      <Button
                        type="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAnswer(question.question_id);
                        }}
                        style={{
                          padding: 0,
                          height: 'auto',
                          fontWeight: 600,
                          color: showAnswer[question.question_id]
                            ? '#52c41a'
                            : '#8C59F1'
                        }}
                      >
                        {showAnswer[question.question_id] ? (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            Sembunyikan Kunci
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <QuestionCircleOutlined /> Lihat Jawaban
                          </span>
                        )}
                      </Button>

                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'center'
                        }}
                      >
                        {question.difficulty && (
                          <Tag
                            style={{
                              borderRadius: 6,
                              textTransform: 'capitalize'
                            }}
                          >
                            {question.difficulty}
                          </Tag>
                        )}
                        {question.points && (
                          <Tag color="gold" style={{ borderRadius: 6 }}>
                            {question.points} Poin
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredQuestions.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                showTotal={(total) => `Total ${total} soal`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BankSoalScreen;
