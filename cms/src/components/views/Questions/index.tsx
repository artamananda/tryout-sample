import parse from 'html-react-parser';
import { QuestionProps } from '../../../types/question';
import { useNavigate } from 'react-router-dom';
import ButtonUi from '../../Ui/Button';
import { Suspense, useEffect, useState } from 'react';
import ModalUpdateQuestion from './ModalUpdateQuestion';
import ModalConfirmDeleteQuestion from './ModalConfirmDeleteQuestion';
import { Image, Spin } from 'antd';
import { DeleteFilled, EditFilled, FileExcelOutlined } from '@ant-design/icons';

type PropTypes = {
  questionList: QuestionProps[];
  questionType: string;
  tryoutId: string;
  setQuestionList: any;
  loading: boolean;
};

const QuestionView = (props: PropTypes) => {
  const { questionList, questionType, tryoutId, setQuestionList, loading } = props;
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState<any>({});

  const showModal = (status: boolean, type: string, question: any) => {
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
            <div
              style={{ display: 'flex', flexDirection: 'column', paddingInline: '20px', paddingBlock: '20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #d9d9d9', justifyContent: 'center', gap: '5px' }}
              key={index}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '100%', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3>Question {question?.local_id}</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <ButtonUi
                      onClick={() => showModal(true, 'update', question)}
                      icon={<EditFilled />}
                      color="#8C59F1"
                      backgroundColor="#f5f5f5"
                    />
                    <ButtonUi
                      icon={<DeleteFilled />}
                      onClick={() => showModal(true, 'delete', question)}
                      color="#FF3E3E"
                      backgroundColor="#f5f5f5"
                    />
                  </div>
                </div>
                {question.image_url && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Image
                      src={question?.image_url}
                      width={400}
                    />
                  </div>
                )}
                <div>
                  <p>{parse(question?.text)}</p>
                </div>
              </div>
              {question.options.every((option: any) => option !== '') ? (
                <div style={{ paddingInline: '10px' }}>
                  {question?.options?.map((option: any, optionIndex: number) => (
                    <p key={optionIndex}>
                      {String.fromCharCode(97 + optionIndex)}. {option}
                    </p>
                  ))}
                </div>
              ) : null}
              <div style={{ paddingInline: '10px', border: '1px solid #d9d9d9', borderRadius: '5px', backgroundColor: '#f5f5f5' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontStyle: 'italic' }}>
                  <h3>Answer : </h3>
                  <p>{question?.correct_answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ fontSize: '80px', color: 'grey' }}>
            <FileExcelOutlined />
          </div>
          <h3 style={{ color: 'grey', fontWeight: 'bold', marginTop: '0px' }}>Questions haven't been made</h3>
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
