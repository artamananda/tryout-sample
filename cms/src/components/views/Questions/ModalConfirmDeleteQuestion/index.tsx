import { Image, message } from 'antd';
import { apiUpdateQuestion, fetchQuestions } from '../../../../api/question';
import { getErrorMessage } from '../../../../helpers/errorHandler';
import { QuestionProps } from '../../../../types/question';
import ModalUi from '../../../Ui/Modal';
import parse from 'html-react-parser';
import { IisModalOpenTypes } from '..';

type PropTypes = {
  setIsModalOpen: React.Dispatch<React.SetStateAction<IisModalOpenTypes>>;
  isModalOpen: IisModalOpenTypes;
  setQuestionList: React.Dispatch<React.SetStateAction<QuestionProps[]>>;
  tryoutId: string;
  questionType: string;
};

const ModalConfirmDeleteQuestion = (props: PropTypes) => {
  const { setIsModalOpen, isModalOpen, setQuestionList, tryoutId, questionType } = props;

  const handleDeleteQuestion = async () => {
    try {
      let newData: QuestionProps = {
        tryout_id: isModalOpen?.question?.tryout_id ?? '',
        question_id: isModalOpen?.question?.question_id ?? '',
        local_id: isModalOpen?.question?.local_id,
        type: questionType,
        text: '',
        options: [''] as string[],
        correct_answer: '',
        image_url: '',
      };
      const res = await apiUpdateQuestion(newData);
      if (res?.status === 200) {
        setIsModalOpen({
          status: false,
        });
        const questionList = await fetchQuestions(tryoutId, questionType);
        const questions = questionList.sort((a: any, b: any) => a.local_id - b.local_id);
        setQuestionList(questions);
        message.success('success delete question');
      }
    } catch (err) {
      message.error(getErrorMessage(err));
      console.log(err);
    }
  };

  const handleOk = () => {
    setIsModalOpen({
      status: false,
    });
    handleDeleteQuestion();
  };

  const handleCancel = () => {
    setIsModalOpen({
      status: false,
    });
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
          <h3>Question {isModalOpen?.question?.local_id}</h3>
          <div>
            {isModalOpen?.question?.image_url && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <Image
                  src={isModalOpen.question?.image_url}
                  width={300}
                />
              </div>
            )}
          </div>
          <div>
            <p>{parse(isModalOpen?.question?.text ?? '')}</p>
          </div>
        </div>

        {isModalOpen?.question?.options?.every((option: any) => option !== '') ? (
          <div style={{ paddingInline: '10px' }}>
            {isModalOpen.question?.options?.map((option: any, optionIndex: number) => (
              <p key={optionIndex}>
                {String.fromCharCode(97 + optionIndex)}. {option}
              </p>
            ))}
          </div>
        ) : null}
        <div style={{ paddingInline: '10px', border: '1px solid #d9d9d9', borderRadius: '5px', backgroundColor: '#f5f5f5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontStyle: 'italic' }}>
            <h3>Answer : </h3>
            <p>{isModalOpen?.question?.correct_answer}</p>
          </div>
        </div>
      </div>
    </ModalUi>
  );
};

export default ModalConfirmDeleteQuestion;
