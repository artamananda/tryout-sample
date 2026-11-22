import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Segmented, Spin, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthUser } from 'react-auth-kit';
import { httpRequest } from '../../helpers/api';
import { getErrorMessage } from '../../helpers/errorMessage';
import renderTextWithMath from '../../components/RenderTextWithMath';
import { QuestionProps } from '../../types/question';
import { SKD_SUBTEST_NAMES } from '../../types/skd.type';

const { Title, Text } = Typography;

const SUBTEST_ORDER = ['twk', 'tiu', 'tkp'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

type AnswerRow = { question_id: string; user_answer: string };

/** Written explanations of a closed tryout, with the participant's answers. */
const TryoutReviewScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuthUser();
  const [questions, setQuestions] = useState<QuestionProps[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [subtest, setSubtest] = useState<string>('twk');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id) return;
    const userId = auth()?.user_id;
    Promise.all([
      httpRequest.get(`/question?tryoutId=${id}`),
      httpRequest.get(`/user-answer/user/${userId}`)
    ])
      .then(([questionRes, answerRes]) => {
        const list: QuestionProps[] = questionRes.data?.payload?.results || [];
        setQuestions(list.sort((a, b) => a.local_id - b.local_id));
        const rows: AnswerRow[] = answerRes.data?.payload?.results || [];
        const byQuestion: Record<string, string> = {};
        rows.forEach((row) => {
          byQuestion[row.question_id] = row.user_answer;
        });
        setAnswers(byQuestion);
        const first = SUBTEST_ORDER.find((code) => list.some((q) => q.type?.toLowerCase() === code));
        if (first) setSubtest(first);
      })
      .catch((err) => setError(getErrorMessage(err, 'Pembahasan tidak dapat dimuat')))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const subtests = useMemo(() => {
    const present = Array.from(new Set(questions.map((q) => q.type?.toLowerCase())));
    return [...SUBTEST_ORDER.filter((code) => present.includes(code)), ...present.filter((code) => !SUBTEST_ORDER.includes(code))];
  }, [questions]);

  const visible = questions.filter((q) => q.type?.toLowerCase() === subtest);
  const isLocked = questions.length > 0 && questions.every((q) => !q.correct_answer);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
          Kembali
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          Pembahasan
        </Title>
      </div>

      {error && <Alert type="error" showIcon message={error} />}
      {isLocked && (
        <Alert
          type="info"
          showIcon
          message="Pembahasan belum tersedia"
          description="Pembahasan dibuka setelah tryout ditutup, untuk paket yang menyertakan pembahasan tertulis."
          action={
            <Button size="small" onClick={() => navigate('/paket')}>
              Lihat Paket
            </Button>
          }
        />
      )}

      {!isLocked && subtests.length > 0 && (
        <>
          <Segmented
            block
            value={subtest}
            onChange={(value) => setSubtest(String(value))}
            options={subtests.map((code) => ({ value: code, label: code.toUpperCase() }))}
          />
          <Text type="secondary">{SKD_SUBTEST_NAMES[subtest] || subtest.toUpperCase()}</Text>

          {visible.length === 0 && <Empty />}
          {visible.map((question, index) => {
            const myAnswer = answers[question.question_id];
            const isTKP = question.type?.toLowerCase() === 'tkp';
            const isCorrect = !isTKP && myAnswer === question.correct_answer;
            return (
              <Card
                key={question.question_id}
                title={`Soal ${index + 1}`}
                extra={
                  !myAnswer ? (
                    <Tag>Tidak dijawab</Tag>
                  ) : isTKP ? (
                    <Tag color="blue">
                      Nilai {question.option_scores?.[question.options.indexOf(myAnswer)] ?? '-'}
                    </Tag>
                  ) : (
                    <Tag color={isCorrect ? 'green' : 'red'}>{isCorrect ? 'Benar' : 'Salah'}</Tag>
                  )
                }
              >
                <div style={{ marginBottom: 12 }}>{renderTextWithMath(question.text)}</div>
                {question.image_url && (
                  <img src={question.image_url} alt="" style={{ maxWidth: '100%', marginBottom: 12 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {question.options.map((option, optionIndex) => {
                    const chosen = option === myAnswer;
                    const right = !isTKP && option === question.correct_answer;
                    return (
                      <div
                        key={optionIndex}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: `1px solid ${right ? '#52c41a' : chosen ? '#1677ff' : '#f0f0f0'}`,
                          background: right ? '#f6ffed' : chosen ? '#e6f4ff' : undefined,
                          display: 'flex',
                          gap: 8
                        }}
                      >
                        <Text strong>{LETTERS[optionIndex] || optionIndex + 1}.</Text>
                        <div style={{ flex: 1 }}>{renderTextWithMath(option)}</div>
                        {isTKP && question.option_scores && (
                          <Tag>{question.option_scores[optionIndex]} poin</Tag>
                        )}
                        {chosen && <Tag color="blue">Jawaban Anda</Tag>}
                      </div>
                    );
                  })}
                </div>
                {question.explanation && (
                  <Alert
                    style={{ marginTop: 12 }}
                    type="success"
                    message="Pembahasan"
                    description={<div>{renderTextWithMath(question.explanation)}</div>}
                  />
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};

export default TryoutReviewScreen;
