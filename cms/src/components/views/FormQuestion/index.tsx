import { Button, Divider, Form, Input, Upload, UploadProps, message } from 'antd';
import Title from 'antd/es/typography/Title';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import { CreateQuestionRequest } from '../../../types/question';
import { ApiGetFileUrlById, S3Upload } from '../../../api/awsSdk';
import { doCreateQuestions } from '../../../api/question';
import { getErrorMessage } from '../../../helpers/errorHandler';
import { debounce } from 'lodash';
import katex from 'katex';
import { UploadOutlined } from '@ant-design/icons';

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

  const [questions, setQuestions] = useState<string[]>(Array.from({ length: questionLength }, () => ''));
  const [options, setOptions] = useState<string[][]>(Array.from({ length: questionLength }, () => Array.from({ length: 5 }, () => '')));
  const [answers, setAnswers] = useState<string[]>(Array.from({ length: questionLength }, () => ''));
  const [images, setImages] = useState<string[]>(Array.from({ length: questionLength }, () => ''));
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
          local_id: i + 1,
          type: questionType,
          text: questions[i],
          options: options[i],
          correct_answer: answers[i],
          image_url: images[i] ? ApiGetFileUrlById(images[i]) : undefined,
        };
        newData.push(createQuestion);
      }

      await doCreateQuestions(newData);
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
    <Form
      layout="vertical"
      onFinish={handleUpdateQuestion}
    >
      <Title>{title}</Title>
      {Array.from({ length: questionLength }, (_, index) => (
        <React.Fragment key={index}>
          <Form.Item
            name={`question_${index + 1}_${questionType}`}
            label={`Question ${index + 1}`}
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
            name={`option_${index + 1}_A_${questionType}`}
            label={`Option ${index + 1} A`}
          >
            <Input onChange={(e) => handleOptionChange(index, 0, e.target.value)} />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_B_${questionType}`}
            label={`Option ${index + 1} B`}
          >
            <Input onChange={(e) => handleOptionChange(index, 1, e.target.value)} />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_C_${questionType}`}
            label={`Option ${index + 1} C`}
          >
            <Input onChange={(e) => handleOptionChange(index, 2, e.target.value)} />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_D_${questionType}`}
            label={`Option ${index + 1} D`}
          >
            <Input onChange={(e) => handleOptionChange(index, 3, e.target.value)} />
          </Form.Item>
          <Form.Item
            name={`option_${index + 1}_E_${questionType}`}
            label={`Option ${index + 1} E`}
          >
            <Input onChange={(e) => handleOptionChange(index, 4, e.target.value)} />
          </Form.Item>

          <Form.Item
            name={`answer_${index + 1}_${questionType}`}
            label={`Answer ${index + 1}`}
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
        >
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormQuestion;
