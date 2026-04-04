import { Flex, Layout, Image, Button, Spin, Modal } from 'antd';
import Option from './Option';
import Question from './Question';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import Timer from './Timer';
import logo from '../../assets/logo-yellow.png';
import { Typography } from 'antd';
import useFetchList from '../../hooks/useFetchList';
import { QuestionProps } from '../../types/question';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { putAnswer, sendAnswer } from '../../api/userAnswer';
import { useAuthUser } from 'react-auth-kit';
import { UserAnswerProps } from '../../types/userAnswer';
import { TransactionTryoutProps } from '../../types/transactionTryout';
import FooterCopyright from '../Footer';
import { finishTryout } from '../../api/tryout';
import { EColor } from '../../constants/color';

const { Text } = Typography;

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '1.4rem',
  padding: 25,
  backgroundColor: EColor.PRIMARY
};

const Tryout = () => {
  const auth = useAuthUser();
  const navigate = useNavigate();
  const splitLink = window.location.href.split('/');
  const tryoutId = splitLink[splitLink.length - 3];
  const questionType = (splitLink[splitLink.length - 2] || '').toLowerCase();
  const questionNumber = splitLink.pop();
  const [questionData, setQuestionData] = useState<QuestionProps[]>([]);
  const [initialTime, setInitialTime] = useState<Date | string>();
  const [duration, setDuration] = useState<number>(195);
  const { data: transactionData, isLoading } =
    useFetchList<TransactionTryoutProps>({
      endpoint: `transaction-tryout`,
      initialQuery: {
        tryoutId: tryoutId,
        userId: auth()?.user_id
      }
    });

  const { data: questionDataFetch } = useFetchList<QuestionProps>({
    endpoint: 'question',
    initialQuery: {
      tryoutId: tryoutId
    }
  });

  const { data: answerData, fetchList: fetchAnswerData } =
    useFetchList<UserAnswerProps>({
      endpoint: 'user-answer/user/' + auth()?.user_id
    });

  const typeDisplayNameMap: Record<string, string> = {
    kpu: 'Penalaran Umum',
    ppu: 'Pengetahuan dan Pemahaman Umum',
    pbm: 'Pemahaman Bacaan dan Menulis',
    pku: 'Pengetahuan Kuantitatif',
    ind: 'Literasi Bahasa Indonesia',
    ing: 'Literasi Bahasa Inggris',
    mtk: 'Penalaran Matematika'
  };

  const [answer, setAnswer] = useState('');
  const [answerIdx, setAnswerIdx] = useState<number>();
  const [answerId, setAnswerId] = useState<string>();

  const typeOrderPreference = ['kpu', 'ppu', 'pbm', 'pku', 'ind', 'ing', 'mtk'];

  const groupedQuestions = useMemo(() => {
    const grouped: Record<string, QuestionProps[]> = {};
    questionData.forEach((question) => {
      const type = (question.type || '').toLowerCase();
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(question);
    });

    Object.keys(grouped).forEach((type) => {
      grouped[type] = grouped[type]
        .slice()
        .sort((a, b) => a.local_id - b.local_id);
    });

    return grouped;
  }, [questionData]);

  const orderedTypes = useMemo(() => {
    const existingTypes = Object.keys(groupedQuestions).filter(
      (type) => groupedQuestions[type] && groupedQuestions[type].length > 0
    );
    const preferredTypes = typeOrderPreference.filter((type) =>
      existingTypes.includes(type)
    );
    const nonPreferredTypes = existingTypes
      .filter((type) => !typeOrderPreference.includes(type))
      .sort();

    return [...preferredTypes, ...nonPreferredTypes];
  }, [groupedQuestions]);

  const currentTypeQuestions = groupedQuestions[questionType] || [];
  const currentQuestionIndex = Math.max(Number(questionNumber || 1) - 1, 0);
  const currentQuestion = currentTypeQuestions[currentQuestionIndex];

  const isLastQuestionInType =
    currentTypeQuestions.length > 0 &&
    currentQuestionIndex >= currentTypeQuestions.length - 1;
  const currentTypeIndex = orderedTypes.indexOf(questionType);
  const nextType =
    currentTypeIndex >= 0 && currentTypeIndex + 1 < orderedTypes.length
      ? orderedTypes[currentTypeIndex + 1]
      : '';
  const isLastQuestionGlobal = isLastQuestionInType && !nextType;

  const persistCurrentAnswer = async () => {
    if (!answer || !currentQuestion) {
      return;
    }

    const data = {
      user_id: auth()?.user_id,
      tryout_id: tryoutId,
      question_id: currentQuestion.question_id,
      user_answer: answer
    };

    if (answerIdx !== undefined && answerId) {
      await putAnswer(answerId, data);
    } else {
      await sendAnswer(data);
    }
    fetchAnswerData();
  };

  const handleNext = async () => {
    await persistCurrentAnswer();

    setAnswer('');

    if (isLastQuestionGlobal) {
      Modal.confirm({
        title: 'Menyelesaikan Tryout',
        content: 'Apakah anda yakin sudah menyelesaikan tryout ini?',
        onOk: () => {
          finishTryout({
            user_id: auth()?.user_id,
            tryout_id: tryoutId
          });
          navigate(`/tryout`);
        }
      });
      return;
    }

    if (isLastQuestionInType && nextType) {
      navigate(`/tryout/${tryoutId}/${nextType}/1`);
    } else {
      navigate(
        `/tryout/${tryoutId}/${questionType}/${Number(questionNumber) + 1}`
      );
    }
  };

  const handlePrev = async () => {
    await persistCurrentAnswer();

    setAnswer('');

    if (Number(questionNumber) > 1) {
      navigate(
        `/tryout/${tryoutId}/${questionType}/${Number(questionNumber) - 1}`
      );
      return;
    }

    if (currentTypeIndex > 0) {
      const prevType = orderedTypes[currentTypeIndex - 1];
      const prevTypeCount = groupedQuestions[prevType]?.length || 1;
      navigate(`/tryout/${tryoutId}/${prevType}/${prevTypeCount}`);
      return;
    }

    navigate(
      `/tryout/${tryoutId}/${questionType}/${
        Number(questionNumber) - 1 > 0 ? Number(questionNumber) - 1 : 1
      }`
    );
  };

  useEffect(() => {
    const sortedQuestionDataFetch = questionDataFetch
      .slice()
      .sort((a, b) => a.local_id - b.local_id);
    const typeOrder = ['kpu', 'ppu', 'pbm', 'pku', 'ind', 'ing', 'mtk'];
    sortedQuestionDataFetch.sort((a, b) => {
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });

    setQuestionData(sortedQuestionDataFetch);
  }, [questionDataFetch]);

  useEffect(() => {
    const currentQuestion = currentTypeQuestions?.[Number(questionNumber) - 1];

    if (currentQuestion) {
      const answerIndex = answerData.findIndex(
        (item) => item.question_id === currentQuestion.question_id
      );

      if (answerIndex !== -1) {
        const userAnswer = answerData[answerIndex].user_answer;
        const optionIndex = currentQuestion.options.findIndex(
          (option) => option === userAnswer
        );
        setAnswerId(answerData[answerIndex].user_answer_id);
        setAnswerIdx(optionIndex);
      } else {
        setAnswerId(undefined);
        setAnswerIdx(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTypeQuestions, answerData, questionNumber]);

  useEffect(() => {
    if (!orderedTypes.length) {
      return;
    }

    const typeExists = orderedTypes.includes(questionType);
    if (!typeExists) {
      navigate(`/tryout/${tryoutId}/${orderedTypes[0]}/1`, { replace: true });
      return;
    }

    const totalInType = groupedQuestions[questionType]?.length || 0;
    if (totalInType === 0) {
      const fallbackType = orderedTypes.find(
        (type) => (groupedQuestions[type] || []).length > 0
      );
      if (fallbackType) {
        navigate(`/tryout/${tryoutId}/${fallbackType}/1`, { replace: true });
      }
      return;
    }

    if (Number(questionNumber) > totalInType) {
      navigate(`/tryout/${tryoutId}/${questionType}/${totalInType}`, {
        replace: true
      });
    }
  }, [
    orderedTypes,
    groupedQuestions,
    questionType,
    questionNumber,
    navigate,
    tryoutId
  ]);

  useEffect(() => {
    if (transactionData?.[0]?.start_time) {
      setInitialTime(transactionData[0].start_time);
      if (transactionData[0]?.tryout?.duration) {
        setDuration(transactionData[0]?.tryout?.duration);
      }
    }
  }, [transactionData]);
  return isLoading ? (
    <div style={{ textAlign: 'center', marginTop: '20%' }}>
      <Spin />
    </div>
  ) : (
    <Flex gap="middle" wrap="wrap">
      <Layout
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <Header style={headerStyle}>
          <Image src={logo} width={120} preview={false} />
          <div>
            {typeDisplayNameMap[questionType] || questionType.toUpperCase()}
          </div>
          {initialTime && duration ? (
            <Timer startTime={initialTime} duration={duration} />
          ) : (
            <div></div>
          )}
        </Header>
        <Content style={{ fontSize: 30, margin: 30 }}>
          <Text style={{ fontSize: 30 }}>{`Soal No. ${questionNumber}`}</Text>
          <div>
            <Question
              text={currentQuestion?.text}
              imageUrl={currentQuestion?.image_url}
            />
          </div>
          <Option
            setAnswer={setAnswer}
            options={currentQuestion?.options}
            initialAnswer={answerIdx}
          />
        </Content>
        <Button
          style={{
            color: 'white',
            backgroundColor: '#04073B',
            marginInline: '30vw',
            paddingBlock: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handlePrev}
        >
          {'<<<Soal Sebelumnya'}
        </Button>
        <Button
          style={{
            color: 'white',
            backgroundColor: '#04073B',
            marginInline: '30vw',
            paddingBlock: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleNext}
        >
          {isLastQuestionGlobal ? 'Selesai' : 'Soal Selanjutnya >>>'}
        </Button>
        <Footer style={{ textAlign: 'center' }}>
          <FooterCopyright />
        </Footer>
      </Layout>
    </Flex>
  );
};

export default Tryout;
