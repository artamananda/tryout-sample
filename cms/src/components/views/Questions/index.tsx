import { QuestionProps } from '../../../types/question';
import { useNavigate } from 'react-router-dom';
import ButtonUi from '../../Ui/Button';
import ModalUpdateQuestion from './ModalUpdateQuestion';
import ModalConfirmDeleteQuestion from './ModalConfirmDeleteQuestion';
import { Image, Spin } from 'antd';
import QuestionCard from '../../Ui/QuestionCard';
import emptyIcon from '../../../assets/emptyIcon.png';
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa6';

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
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ECECFC', borderRadius: '10px', border: '1px solid #D0D0D0', paddingInline: '20px', paddingBlock: '15px', color: '#343672', fontSize: '13px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: 0, height: '20px' }}>
                <p style={{ fontWeight: '600' }}>Jenis Soal : </p>
                <p>
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
                  <span> ({questionType.toUpperCase()})</span>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
                <p style={{ fontWeight: '600' }}>Jumlah Soal : </p>
                <p>
                  {questionList.length}
                  <span style={{ fontWeight: '600', color: 'red' }}>
                    {questionType === 'kpu' ? '/30 Soal' : questionType === 'ppu' ? '/20 Soal' : questionType === 'pbm' ? '/20 Soal' : questionType === 'pku' ? '/15 Soal' : questionType === 'ind' ? '/30 Soal' : questionType === 'ing' ? '/20 Soal' : questionType === 'mtk' ? '/20 Soal' : 'Literasi'}
                  </span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ButtonUi
                title="Add More Question"
                backgroundColor="#8C59F1"
                color="white"
                icon={<FaPlus />}
                onClick={() => navigate('/tryout/' + tryoutId + '/create' + '/question/' + questionType)}
              />
            </div>
          </div>
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
