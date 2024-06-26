import { Flex, Layout, Image, Button } from 'antd';
import Option from './Option';
import Question from './Question';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import Timer from './Timer';
import logo from '../../assets/logo-yellow.png';
import { Typography } from 'antd';
import useFetchList from '../../hooks/useFetchList';
import { QuestionProps } from '../../types/question';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { putAnswer, sendAnswer } from '../../api/userAnswer';
import { useAuthUser } from 'react-auth-kit';
import { UserAnswerProps } from '../../types/userAnswer';
import { TransactionTryoutProps } from '../../types/transactionTryout';
import FooterCopyright from '../Footer';

const { Text } = Typography;

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '1.4rem',
  padding: 25,
  backgroundColor: '#04073B'
};

const Tryout = () => {
  const auth = useAuthUser();
  const navigate = useNavigate();
  const splitLink = window.location.href.split('/');
  const tryoutId = splitLink[splitLink.length - 3];
  const questionType = splitLink[splitLink.length - 2];
  const questionNumber = splitLink.pop();
  const [questionData, setQuestionData] = useState<QuestionProps[]>([]);
  const [initialTime, setInitialTime] = useState<Date | string>();
  const { data: transactionData } = useFetchList<TransactionTryoutProps>({
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

  const plusData: { [key: string]: number } = {
    kpu: 0,
    ppu: 30,
    pbm: 50,
    pku: 70,
    ind: 85,
    ing: 115,
    mtk: 135
  };

  const [answer, setAnswer] = useState('');
  const [answerIdx, setAnswerIdx] = useState<number>();
  const [answerId, setAnswerId] = useState<string>();

  const handleNext = async () => {
    if (answer) {
      const data = {
        user_id: auth()?.user_id,
        tryout_id: tryoutId,
        question_id:
          questionData?.[plusData[questionType] + Number(questionNumber) - 1]
            ?.question_id,
        user_answer: answer
      };
      console.log(data);
      if (answerIdx !== undefined && answerId) {
        await putAnswer(answerId, data);
      } else {
        await sendAnswer(data);
      }
      fetchAnswerData();
    }
    setAnswer('');
    if (questionType === 'kpu' && Number(questionNumber) === 30) {
      navigate(`/tryout/${tryoutId}/ppu/1`);
    } else if (questionType === 'ppu' && Number(questionNumber) === 20) {
      navigate(`/tryout/${tryoutId}/pbm/1`);
    } else if (questionType === 'pbm' && Number(questionNumber) === 20) {
      navigate(`/tryout/${tryoutId}/pku/1`);
    } else if (questionType === 'pku' && Number(questionNumber) === 15) {
      navigate(`/tryout/${tryoutId}/ind/1`);
    } else if (questionType === 'ind' && Number(questionNumber) === 30) {
      navigate(`/tryout/${tryoutId}/ing/1`);
    } else if (questionType === 'ing' && Number(questionNumber) === 20) {
      navigate(`/tryout/${tryoutId}/mtk/1`);
    } else if (questionType === 'mtk' && Number(questionNumber) === 20) {
      navigate(`/tryout`);
    } else {
      navigate(
        `/tryout/${tryoutId}/${questionType}/${Number(questionNumber) + 1}`
      );
    }
  };

  const handlePrev = async () => {
    if (answer) {
      const data = {
        user_id: auth()?.user_id,
        tryout_id: tryoutId,
        question_id:
          questionData?.[plusData[questionType] + Number(questionNumber) - 1]
            ?.question_id,
        user_answer: answer
      };
      console.log(data);
      if (answerIdx !== undefined && answerId) {
        await putAnswer(answerId, data);
      } else {
        await sendAnswer(data);
      }
      fetchAnswerData();
    }
    setAnswer('');
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

    console.log('sorted data', sortedQuestionDataFetch);

    setQuestionData(sortedQuestionDataFetch);
  }, [questionDataFetch]);

  useEffect(() => {
    const currentQuestion =
      questionData?.[plusData[questionType] + Number(questionNumber) - 1];

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
        console.log('set to ', optionIndex);
      } else {
        setAnswerId(undefined);
        setAnswerIdx(undefined);
        console.log('set to undefined');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionData, answerData, questionNumber, questionType]);

  useEffect(() => {
    if (transactionData?.[0]?.start_time) {
      setInitialTime(transactionData[0].start_time);
    }
  }, [transactionData]);
  return (
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
            {questionType === 'kpu'
              ? 'Penalaran Umum'
              : questionType === 'ppu'
              ? 'Pengetahuan dan Pemahaman Umum'
              : questionType === 'pbm'
              ? 'Pemahaman Bacaan dan Menulis'
              : questionType === 'pku'
              ? 'Pengetahuan Kuantitatif'
              : questionType === 'ind'
              ? 'Literasi Bahasa Indonesia'
              : questionType === 'ing'
              ? 'Literasi Bahasa Inggris'
              : questionType === 'mtk'
              ? 'Penalaran Matematika'
              : 'Literasi'}
          </div>
          {initialTime ? (
            <Timer startTime={initialTime} duration={300} />
          ) : (
            <div></div>
          )}
        </Header>
        <Content style={{ fontSize: 30, margin: 30 }}>
          <Text style={{ fontSize: 30 }}>{`Soal No. ${questionNumber}`}</Text>
          <div>
            <Question
              text={
                questionData?.[
                  plusData[questionType] + Number(questionNumber) - 1
                ]?.text
              }
              imageUrl={
                questionData?.[
                  plusData[questionType] + Number(questionNumber) - 1
                ]?.image_url
              }
            />
          </div>
          <Option
            setAnswer={setAnswer}
            options={
              questionData?.[
                plusData[questionType] + Number(questionNumber) - 1
              ]?.options
            }
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
          {questionType === 'mtk' && Number(questionNumber) === 20
            ? 'Selesai'
            : 'Soal Selanjutnya >>>'}
        </Button>
        <Footer style={{ textAlign: 'center' }}>
          <FooterCopyright />
        </Footer>
      </Layout>
    </Flex>
  );
};

export default Tryout;
