import { QuestionProps } from '../../../types/question';
import { useNavigate } from 'react-router-dom';
import ButtonUi from '../../Ui/Button';
import ModalUpdateQuestion from './ModalUpdateQuestion';
import ModalConfirmDeleteQuestion from './ModalConfirmDeleteQuestion';
import { Image, Spin } from 'antd';
import QuestionCard from '../../Ui/QuestionCard';
import emptyIcon from '../../../assets/emptyIcon.png';
import { useState } from 'react';

type PropTypes = {
  questionList: QuestionProps[];
  questionType: string;
  tryoutId: string;
  setQuestionList: React.Dispatch<React.SetStateAction<QuestionProps[]>>;
  loading: boolean;
};

export interface IisModalOpenTypes {
  status: boolean;
  type?: string;
  question?: QuestionProps;
}

const QuestionView = (props: PropTypes) => {
  const { questionList, questionType, tryoutId, setQuestionList, loading } = props;
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState<IisModalOpenTypes>({
    status: false,
    type: '',
    question: {
      question_id: '',
      tryout_id: '',
      type: '',
      text: '',
      options: [],
      image_url: '',
      correct_answer: '',
    },
  });

  const showModal = (status: boolean, type: string, question: QuestionProps) => {
    setIsModalOpen({
      status: status,
      type: type,
      question: question,
    });
  };

  return (
    <div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Spin size="large" />
            <p style={{ color: 'blue', fontStyle: 'italic', fontWeight: 'normal' }}>Loading...</p>
          </div>
        </div>
      ) : questionList.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {questionList?.map((question: any, index: number) => (
            <QuestionCard
              question={question}
              showModal={showModal}
              key={index}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <Image
            src={emptyIcon}
            width={150}
          />
          <h3 style={{ color: 'grey', fontStyle: 'italic', fontWeight: 'normal', marginTop: 0 }}>Question hasn't been made</h3>
          <ButtonUi
            title="Create Question"
            backgroundColor="#8C59F1"
            color="white"
            onClick={() => navigate('/tryout/' + tryoutId + '/create' + '/question/' + questionType)}
          />
        </div>
      )}
      {isModalOpen.status && isModalOpen.type === 'update' && (
        <ModalUpdateQuestion
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setQuestionList={setQuestionList}
          tryoutId={tryoutId}
          questionType={questionType}
        />
      )}

      {isModalOpen.status && isModalOpen.type === 'delete' && (
        <ModalConfirmDeleteQuestion
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setQuestionList={setQuestionList}
          tryoutId={tryoutId}
          questionType={questionType}
        />
      )}
    </div>
  );
};

export default QuestionView;
