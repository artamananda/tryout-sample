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
import { sendAnswer } from '../../api/userAnswer';
import { useAuthUser } from 'react-auth-kit';
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
  const questionType = splitLink[splitLink.length - 2];
  const questionNumber = splitLink.pop();
  const { data: questionData } = useFetchList<QuestionProps>({
    endpoint: 'tryout/question/' + tryoutId
  });

  const plusData: { [key: string]: number } = {
    kpu: 0,
    ppu: 30,
    pbm: 50,
    pku: 70
  };

  const [answer, setAnswer] = useState('');

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
      await sendAnswer(data);
    }
    setAnswer('');
    if (questionType === 'kpu' && Number(questionNumber) === 30) {
      navigate(`/tryout/${tryoutId}/ppu/1`);
    } else if (questionType === 'ppu' && Number(questionNumber) === 20) {
      navigate(`/tryout/${tryoutId}/pbm/1`);
    } else if (questionType === 'pbm' && Number(questionNumber) === 20) {
      navigate(`/tryout/${tryoutId}/pku/1`);
    } else if (questionType === 'pku' && Number(questionNumber) === 15) {
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
      await sendAnswer(data);
    }
    setAnswer('');
    navigate(
      `/tryout/${tryoutId}/${questionType}/${
        Number(questionNumber) - 1 > 0 ? Number(questionNumber) - 1 : 1
      }`
    );
  };

  useEffect(() => {
    console.log(questionData);
  }, [questionData]);
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
              : 'Literasi'}
          </div>
          <div>{Timer()}</div>
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
            />
          </div>
          <Option
            setAnswer={setAnswer}
            options={
              questionData?.[
                plusData[questionType] + Number(questionNumber) - 1
              ]?.options
            }
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
          {questionType === 'pku' && Number(questionNumber) === 15
            ? 'Selesai'
            : 'Soal Selanjutnya >>>'}
        </Button>
        <Footer style={{ textAlign: 'center' }}>
          Telisik Tryout ©2024 Created by Artamananda
        </Footer>
      </Layout>
    </Flex>
  );
};

export default Tryout;
