import { Button, Divider, Form, Input, Upload, UploadProps, message } from 'antd';
import Title from 'antd/es/typography/Title';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import { CreateQuestionRequest, QuestionProps } from '../../../types/question';
import { ApiGetFileUrlById, S3Upload } from '../../../api/awsSdk';
import { doCreateQuestions, fetchQuestions } from '../../../api/question';
import { getErrorMessage } from '../../../helpers/errorHandler';
import { debounce } from 'lodash';
import katex from 'katex';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ButtonUi from '../../Ui/Button';
import { IoCheckmarkDoneCircle } from 'react-icons/io5';
import { IoArrowBackCircleOutline } from 'react-icons/io5';
window.katex = katex;

const quillModules = {
  toolbar: {
    container: [[{ header: [1, 2, 3, 4, 5, 6, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], [{ align: [] }], ['link', 'image'], ['clean'], ['formula'], [{ color: [] }]],
  },
};

const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'formula'];

type PropTypes = {
  questionType: string;
  tryoutId: string;
  questionLength: number;
  title: string;
};

const FormQuestion = (props: PropTypes) => {
  const { questionType, tryoutId, questionLength, title } = props;
  const [questionList, setQuestionList] = useState<QuestionProps[]>([]);
  const navigate = useNavigate();

  const fetchDataQuestion = async () => {
    const questionList = await fetchQuestions(tryoutId, questionType);
    const questions = questionList.sort((a: any, b: any) => a.local_id - b.local_id);
    setQuestionList(questions);
  };

  useEffect(() => {
    fetchDataQuestion();
  }, []);

  //get local_id from question already created
  const existingLocalId = questionList.map((question) => question.local_id);

  //filtering local_id to get new local_id have not be created
  const newLocalId = Array.from({ length: questionLength }, (_, index) => index + 1).filter((index) => !existingLocalId.includes(index));

  const [questions, setQuestions] = useState<string[]>(Array.from({ length: newLocalId.length }, () => ''));
  const [options, setOptions] = useState<string[][]>(Array.from({ length: newLocalId.length }, () => Array.from({ length: 5 }, () => '')));
  const [answers, setAnswers] = useState<string[]>(Array.from({ length: newLocalId.length }, () => ''));
  const [images, setImages] = useState<string[]>(Array.from({ length: newLocalId.length }, () => ''));
  const [idxImg, setIdxImg] = useState(0);

  const imageProps: UploadProps = {
    multiple: false,
    customRequest: async ({ file }) => {
      try {
        const url = await S3Upload(file);
        if (url) {
          message.success(`file uploaded successfully`);
          updateImageAtIndex(idxImg, url);
        }
      } catch (error) {
        message.error(`file upload failed.`);
      }
    },
  };

  const handleUpdateQuestion = async (data: any) => {
    try {
      let newData: CreateQuestionRequest[] = [];
      for (let i = 0; i < questionLength; i++) {
        const createQuestion: CreateQuestionRequest = {
          tryout_id: tryoutId,
          local_id: i,
          type: questionType,
          text: questions[i],
          options: options[i],
          correct_answer: answers[i],
          image_url: images[i] ? ApiGetFileUrlById(images[i]) : undefined,
        };
        newData.push(createQuestion);
      }

      await doCreateQuestions(newData);
      navigate('/tryout/' + tryoutId + '/question/' + questionType);
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const updateQuestionAtIndex = (index: number, newValue: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = newValue;
    setQuestions(updatedQuestions);
  };

  const updateOptionAtIndex = (index: number, subIndex: number, newValue: string) => {
    const updatedOptions = [...options];
    updatedOptions[index][subIndex] = newValue;
    setOptions(updatedOptions);
  };

  const updateAnswerAtIndex = (index: number, newValue: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = newValue;
    setAnswers(updatedAnswers);
  };

  const updateImageAtIndex = (index: number, newValue: string) => {
    const updatedImages = [...images];
    updatedImages[index] = newValue;
    setImages(updatedImages);
  };

  const debouncedUpdateQuestionAtIndex = debounce((index, value) => {
    updateQuestionAtIndex(index, value);
  }, 300);

  const handleQuestionChange = (index: number, value: any) => {
    debouncedUpdateQuestionAtIndex(index, value);
  };

  const debouncedUpdateOptionAtIndex = debounce((index, subIndex, value) => {
    updateOptionAtIndex(index, subIndex, value);
  }, 300);

  const handleOptionChange = (index: number, subIndex: number, value: any) => {
    debouncedUpdateOptionAtIndex(index, subIndex, value);
  };

  const debouncedUpdateAnswerAtIndex = debounce((index, value) => {
    updateAnswerAtIndex(index, value);
  }, 300);

  const handleAnswerChange = (index: number, value: any) => {
    debouncedUpdateAnswerAtIndex(index, value);
  };

  useEffect(() => {
    console.log(questions);
    console.log(images);
  }, [questions, images]);
  return (
    <Form layout="vertical">
      {newLocalId.length !== 0 ? (
        <>
          <Title>{title}</Title>
          {newLocalId.map((index) => (
            <React.Fragment key={index}>
              <Form.Item
                name={`question_${index}_${questionType}`}
                label={`Question ${index}`}
              >
                <ReactQuill
                  style={{ backgroundColor: 'white' }}
                  theme="snow"
                  value={questions[index]}
                  onChange={(value) => handleQuestionChange(index, value)}
                  modules={quillModules}
                  formats={quillFormats}
                />
              </Form.Item>

              <Form.Item>
                <Upload
                  {...imageProps}
                  onChange={() => setIdxImg(index)}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name={`option_${index}_A_${questionType}`}
                label={`Option ${index} A`}
              >
                <Input onChange={(e) => handleOptionChange(index, 0, e.target.value)} />
              </Form.Item>
              <Form.Item
                name={`option_${index}_B_${questionType}`}
                label={`Option ${index} B`}
              >
                <Input onChange={(e) => handleOptionChange(index, 1, e.target.value)} />
              </Form.Item>
              <Form.Item
                name={`option_${index}_C_${questionType}`}
                label={`Option ${index} C`}
              >
                <Input onChange={(e) => handleOptionChange(index, 2, e.target.value)} />
              </Form.Item>
              <Form.Item
                name={`option_${index}_D_${questionType}`}
                label={`Option ${index} D`}
              >
                <Input onChange={(e) => handleOptionChange(index, 3, e.target.value)} />
              </Form.Item>
              <Form.Item
                name={`option_${index}_E_${questionType}`}
                label={`Option ${index} E`}
              >
                <Input onChange={(e) => handleOptionChange(index, 4, e.target.value)} />
              </Form.Item>

              <Form.Item
                name={`answer_${index}_${questionType}`}
                label={`Answer ${index}`}
              >
                <Input
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </Form.Item>

              <Divider />
            </React.Fragment>
          ))}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                display: 'flex',
                width: '100%',
                paddingBlock: 20,
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginTop: 10,
              }}
              onClick={handleUpdateQuestion}
            >
              Save
            </Button>
          </Form.Item>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <IoCheckmarkDoneCircle
            size={170}
            color="primary"
            style={{ color: '#8C59F1' }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginTop: '-8px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ color: 'grey', fontStyle: 'italic', fontWeight: 'normal' }}>
                <span style={{ fontWeight: 'bold' }}>{title}</span> has completed.
              </h3>

              <button
                style={{ color: '#f5f5f5', backgroundColor: '#8C59F1', paddingInline: '13px', borderRadius: '5px', border: '1px solid #d9d9d9', gap: '10px', display: 'flex', alignItems: 'center' }}
                onClick={() => window.history.back()}
              >
                <IoArrowBackCircleOutline size={30} />
                <p style={{ fontSize: '14px' }}>Back to Questions</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
};

export default FormQuestion;
