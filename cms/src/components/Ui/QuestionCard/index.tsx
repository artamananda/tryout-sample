import { DeleteFilled, EditFilled } from '@ant-design/icons';
import ButtonUi from '../Button';
import { Image } from 'antd';
import parse from 'html-react-parser';
import emptyIcon from '../../../assets/emptyIcon.png';
import { FaPlus } from 'react-icons/fa6';
import { QuestionProps } from '../../../types/question';

type PropTypes = {
  question: QuestionProps;
  showModal: (show: boolean, action: string, question: any) => void;
};

const QuestionCard = ({ question, showModal }: PropTypes) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingInline: '20px', paddingBlock: '20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #d9d9d9', justifyContent: 'center', gap: '5px' }}>
      {question.text !== '' ? (
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
                width={350}
                height={200}
              />
            </div>
          )}
          <div>
            <p>{parse(question?.text ?? '')}</p>
          </div>
          {question?.options?.every((option: any) => option !== '') ? (
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Question {question?.local_id}</h3>
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <Image
              src={emptyIcon}
              width={150}
            />
            <div style={{ marginTop: '-8px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ color: 'grey', fontStyle: 'italic', fontWeight: 'normal' }}>Question hasn't been made</h3>
              <ButtonUi
                onClick={() => showModal(true, 'update', question)}
                icon={<FaPlus />}
                backgroundColor="#8C59F1"
                color="#f5f5f5"
                title="Add Question"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
