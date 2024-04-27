import { Button, Divider, Form, Image, Input, Upload, UploadProps, message } from 'antd';
import { QuestionProps } from '../../../../types/question';
import ModalUi from '../../../Ui/Modal';
import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import { CopyOutlined, UploadOutlined } from '@ant-design/icons';
import { ApiGetFileUrlById, S3Upload } from '../../../../api/awsSdk';
import { apiUpdateQuestion, fetchQuestions } from '../../../../api/question';
import parse from 'html-react-parser';
import { getErrorMessage } from '../../../../helpers/errorHandler';
import copy from 'copy-to-clipboard';

type PropTypes = {
  setIsModalOpen: any;
  isModalOpen: any;
  setQuestionList: any;
  tryoutId: string;
  questionType: string;
};

const ModalUpdateQuestion = (props: PropTypes) => {
  const { setIsModalOpen, isModalOpen, setQuestionList, tryoutId, questionType } = props;
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>(isModalOpen?.question?.options || Array.from({ length: 5 }, () => ''));
  const [answer, setAnswer] = useState<string>('');
  const [image, setImage] = useState<string>('');
  console.log(options);

  const quillModules = {
    toolbar: {
      container: [[{ header: [1, 2, 3, 4, 5, 6, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], [{ align: [] }], ['link', 'image'], ['clean'], ['formula'], [{ color: [] }]],
    },
  };

  const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'formula'];

  const imageUploadProps: UploadProps = {
    multiple: false,
    customRequest: async ({ file }) => {
      console.log(file);

      try {
        const url = await S3Upload(file);
        console.log(url);
        if (url) {
          setImage(url);
          message.success(`file uploaded successfully`);
        }
      } catch (error) {
        console.log('File upload failed', error);
      }
    },
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
  };

  const handleUpdateQuestion = async () => {
    try {
      let newData: QuestionProps = {
        tryout_id: isModalOpen?.question.tryout_id,
        question_id: isModalOpen?.question.question_id,
        local_id: isModalOpen?.question.local_id,
        type: questionType,
        text: question !== '' ? question : isModalOpen.question.text,
        options: options.every((option) => option !== '') ? options : ([''] as string[]),
        correct_answer: answer !== '' ? answer : isModalOpen.question.correct_answer,
        image_url: image !== '' ? ApiGetFileUrlById(image) : isModalOpen.question.image_url,
      };
      const res = await apiUpdateQuestion(newData);
      if (res?.status === 200) {
        setIsModalOpen(false);
        const questionList = await fetchQuestions(tryoutId, questionType);
        const questions = questionList.sort((a: any, b: any) => a.local_id - b.local_id);
        setQuestionList(questions);
      }
    } catch (err) {
      message.error(getErrorMessage(err));
      console.log(err);
    }
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <ModalUi
      isModalOpen={isModalOpen}
      handleOk={handleOk}
      handleCancel={handleCancel}
      title="Update Question"
    >
      <Form
        layout="vertical"
        onFinish={handleUpdateQuestion}
      >
        <React.Fragment>
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

          <div style={{ border: '1px solid #BABABA', marginBottom: '10px', paddingInline: '10px', borderRadius: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '30px', alignItems: 'center', marginTop: '5px' }}>
              <h3>Question {isModalOpen?.question?.local_id}</h3>
              <CopyOutlined
                onClick={() => {
                  if (copy(isModalOpen?.question?.text)) {
                    message.success('Question has been copied!');
                  }
                }}
                style={{ color: 'grey' }}
              />
            </div>
            <p style={{ fontStyle: 'initial', color: '#777777' }}>{parse(isModalOpen?.question?.text)}</p>
          </div>
          <Form.Item
            name="question"
            // label="Question"
          >
            <ReactQuill
              key="question"
              style={{ backgroundColor: 'white' }}
              theme="snow"
              modules={quillModules}
              formats={quillFormats}
              defaultValue={isModalOpen?.question?.text ? '' : isModalOpen?.question?.text}
              onChange={(value) => handleQuestionChange(value)}
              value={isModalOpen?.question?.text || ''}
              placeholder="Enter New question"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item>
              <Upload {...imageUploadProps}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                >
                  Click to Upload
                </Button>
              </Upload>
            </Form.Item>
          </Form.Item>
          <Form.Item
            name="optionsA"
            label={'Option A'}
          >
            <Input
              name="optionsA"
              type="options"
              placeholder="Enter option A"
              defaultValue={isModalOpen?.question?.options[0]}
              onChange={(e) => handleOptionChange(0, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="optionsB"
            label={'Option B'}
          >
            <Input
              name="optionsB"
              type="options"
              placeholder="Enter option B"
              defaultValue={isModalOpen?.question?.options[1]}
              onChange={(e) => handleOptionChange(1, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="optionsC"
            label={'Option C'}
          >
            <Input
              name="optionsC"
              type="options"
              placeholder="Enter option C"
              defaultValue={isModalOpen?.question?.options[2]}
              onChange={(e) => handleOptionChange(2, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="optionsD"
            label={'Option D'}
          >
            <Input
              name="optionsD"
              type="options"
              placeholder="Enter option D"
              defaultValue={isModalOpen?.question?.options[3]}
              onChange={(e) => handleOptionChange(3, e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="optionsE"
            label={'Option E'}
          >
            <Input
              name="optionsE"
              type="options"
              placeholder="Enter option E"
              defaultValue={isModalOpen?.question?.options[4]}
              onChange={(e) => handleOptionChange(4, e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name="correct_answer"
            label={'Answer'}
          >
            <Input
              name="correct_answer"
              type="correct_answer"
              placeholder="Enter correct answer"
              defaultValue={isModalOpen?.question?.correct_answer}
              onChange={(e: any) => handleAnswerChange(e.target.value)}
            />
          </Form.Item>

          <Divider />
        </React.Fragment>
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
    </ModalUi>
  );
};

export default ModalUpdateQuestion;
