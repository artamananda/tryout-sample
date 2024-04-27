import { Image, message } from 'antd';
import { fetchQuestions } from '../../../../api/question';
import { httpRequest } from '../../../../helpers/api';
import { getErrorMessage } from '../../../../helpers/errorHandler';
import { BaseResponseProps } from '../../../../types/config.type';
import { QuestionProps } from '../../../../types/question';
import ModalUi from '../../../Ui/Modal';
import parse from 'html-react-parser';

type PropTypes = {
  setIsModalOpen: any;
  isModalOpen: any;
  setQuestionList: any;
  tryoutId: string;
  questionType: string;
};

const ModalConfirmDeleteQuestion = (props: PropTypes) => {
  const { setIsModalOpen, isModalOpen, setQuestionList, tryoutId, questionType } = props;

  const handleDeleteQuestion = async (question_id: string) => {
    try {
      const res = await httpRequest.delete<BaseResponseProps<QuestionProps>>(process.env.REACT_APP_BASE_URL + '/question/' + question_id);
      console.log(res);
      if (res) {
        const questionList = await fetchQuestions(tryoutId, questionType);
        const questions = questionList.sort((a: any, b: any) => a.local_id - b.local_id);
        setQuestionList(questions);
        message.success(`success delete question ${isModalOpen.question.local_id}`);
      }
      return res;
    } catch (err) {
      const error = getErrorMessage(err);
      console.error(error);
      message.error(error);
    }
  };
  const handleOk = () => {
    setIsModalOpen(false);
    handleDeleteQuestion(isModalOpen.question.question_id);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <ModalUi
      isModalOpen={isModalOpen}
      handleOk={handleOk}
      handleCancel={handleCancel}
      title="Delete Question"
    >
      <h3 style={{ color: 'red', fontStyle: 'italic', fontSize: '17px' }}>Are you sure to delete this question?</h3>
      <div style={{ display: 'flex', flexDirection: 'column', paddingInline: '20px', paddingBlock: '5px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #d9d9d9', justifyContent: 'center', gap: '5px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Question {isModalOpen.question?.local_id}</h3>
          <div>
            {isModalOpen.question.image_url && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <Image
                  src={isModalOpen.question?.image_url}
                  width={300}
                />
              </div>
            )}
          </div>
          <div>
            <p>{parse(isModalOpen.question?.text)}</p>
          </div>
        </div>
        <div style={{ paddingInline: '10px' }}>
          {isModalOpen.question?.options?.map((option: any, optionIndex: number) => (
            <p key={optionIndex}>
              {String.fromCharCode(97 + optionIndex)}. {option}
            </p>
          ))}
        </div>
      </div>
    </ModalUi>
  );
};

export default ModalConfirmDeleteQuestion;
