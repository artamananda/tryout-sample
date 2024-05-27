import { Button, Divider, Form, Image, Input, Upload, UploadProps, message } from 'antd';
import { QuestionProps } from '../../../../types/question';
import ModalUi from '../../../Ui/Modal';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import { CopyOutlined, DeleteFilled, UploadOutlined } from '@ant-design/icons';
import { ApiGetFileUrlById, S3Upload } from '../../../../api/awsSdk';
import { apiUpdateQuestion, fetchQuestions } from '../../../../api/question';
import parse from 'html-react-parser';
import { getErrorMessage } from '../../../../helpers/errorHandler';
import copy from 'copy-to-clipboard';
import { IisModalOpenTypes } from '..';
import { MdEdit, MdImageNotSupported } from 'react-icons/md';
import ButtonUi from '../../../Ui/Button';
import { IoReload } from 'react-icons/io5';
import RunningAlert from '../../../Ui/RunningAlert';
import SwitchButton from '../../../Ui/SwitchButton';

type PropTypes = {
  setIsModalOpen: React.Dispatch<React.SetStateAction<IisModalOpenTypes>>;
  isModalOpen: IisModalOpenTypes;
  setQuestionList: React.Dispatch<React.SetStateAction<QuestionProps[]>>;
  tryoutId: string;
  questionType: string;
};

const ModalUpdateQuestion = (props: PropTypes) => {
  const { setIsModalOpen, isModalOpen, setQuestionList, tryoutId, questionType } = props;
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>(isModalOpen?.question?.options || Array.from({ length: 5 }, () => ''));
  const [answer, setAnswer] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [isOptions, setIsOptions] = useState<boolean>(isModalOpen?.question?.is_options || false);
  const [isImageEmpty, setIsImageEmpty] = useState(false);
  const [activedMode, setActivedMode] = useState<boolean>(false);

  const quillModules = {
    toolbar: {
      container: [[{ header: [1, 2, 3, 4, 5, 6, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], [{ align: [] }], ['link', 'image'], ['clean'], ['formula'], [{ color: [] }]],
    },
  };

  const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'formula'];

  const imageUploadProps: UploadProps = {
    multiple: false,
    customRequest: async ({ file }) => {
      try {
        const url = await S3Upload(file);
        console.log(url);
        if (url) {
          setImage(ApiGetFileUrlById(url));
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
        tryout_id: isModalOpen?.question?.tryout_id ?? '',
        question_id: isModalOpen?.question?.question_id ?? '',
        local_id: isModalOpen?.question?.local_id,
        type: questionType,
        text: question !== '' ? question : isModalOpen?.question?.text ?? '',
        options: options?.every((option) => option !== '') ? options : ([''] as string[]),
        correct_answer: answer !== '' ? answer : isModalOpen?.question?.correct_answer ?? '',
        image_url: image,
        is_options: isOptions,
      };
      const res = await apiUpdateQuestion(newData);
      if (res?.status === 200) {
        setIsModalOpen({
          status: false,
        });
        const questionList = await fetchQuestions(tryoutId, questionType);
        const questions = questionList.sort((a: any, b: any) => a.local_id - b.local_id);
        setQuestionList(questions);
        message.success('success update question');
      }
    } catch (err) {
      message.error(getErrorMessage(err));
      console.log(err);
    }
  };

  const handleRemoveImage = () => {
    setIsImageEmpty(true);
    setImage('');
  };
  const handleUnremoveImage = () => {
    setIsImageEmpty(false);
    setImage(isModalOpen?.question?.image_url || '');
  };

  const handleOk = () => {
    setIsModalOpen({
      status: false,
    });
  };

  const handleCancel = () => {
    setIsModalOpen({
      status: false,
    });
  };

  const HandleChangeButtonSwitch = (isOptions: boolean) => {
    if (!isOptions) {
      setOptions([''] as string[]);
      setIsOptions(false);
    } else {
      setIsOptions(true);
      setOptions(isModalOpen?.question?.options ?? Array.from({ length: 5 }, () => ''));
      setActivedMode(true);
    }
  };

  useEffect(() => {
    handleUnremoveImage();
  }, []);

  useEffect(() => {
    HandleChangeButtonSwitch(isOptions);
  }, [isOptions]);

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
          <div style={{ border: '1px solid #BABABA', marginBottom: '10px', paddingInline: '10px', borderRadius: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '30px', alignItems: 'center', marginTop: '5px' }}>
              <h3>Question {isModalOpen?.question?.local_id}</h3>
              <CopyOutlined
                onClick={() => {
                  if (isModalOpen?.question?.text !== '') {
                    if (copy(isModalOpen?.question?.text ?? '')) {
                      message.success('Question has been copied!');
                    }
                  }
                }}
                style={{ color: 'grey' }}
              />
            </div>
            {isModalOpen?.question?.text !== '' ? <p style={{ fontStyle: 'initial', color: '#777777' }}>{parse(isModalOpen?.question?.text ?? '')}</p> : <p style={{ fontStyle: 'initial', color: '#777777' }}>No question yet</p>}
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
              value={isModalOpen?.question?.text ?? ''}
              placeholder="Enter New question"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start', gap: '8px' }}>
              {isImageEmpty ? (
                <div>
                  {isModalOpen?.question?.image_url !== '' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', flexDirection: 'column', alignItems: 'center' }}>
                      <MdImageNotSupported
                        size={100}
                        style={{ color: 'gray' }}
                      />
                      <p style={{ fontSize: '13px', color: 'gray', fontStyle: 'italic' }}>No image</p>
                      <ButtonUi
                        icon={<IoReload size={17} />}
                        title="Unremove"
                        onClick={() => handleUnremoveImage()}
                        backgroundColor="#8C59F1"
                        color="white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {isModalOpen?.question?.image_url !== '' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', flexDirection: 'column', alignItems: 'start' }}>
                      <Image
                        src={isModalOpen.question?.image_url}
                        width={300}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ButtonUi
                          title="remove"
                          onClick={() => handleRemoveImage()}
                          backgroundColor="#D74D4D"
                          color="white"
                          icon={<DeleteFilled />}
                        />
                        <ButtonUi
                          title="Change Image"
                          backgroundColor="#8C59F1"
                          color="white"
                          icon={<MdEdit />}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {isModalOpen?.question?.image_url === '' ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', flexDirection: 'column', alignItems: 'center' }}>
                  {image ? (
                    <div style={{ display: 'flex', alignItems: 'start' }}>
                      <Image
                        src={image}
                        width={300}
                      />
                      <button
                        onClick={() => setImage('')}
                        style={{ border: '1px solid #D9D9D9', color: '#9E9E9E', backgroundColor: 'white', padding: '2px', borderRadius: '5px' }}
                      >
                        <DeleteFilled size={20} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <MdImageNotSupported
                        size={100}
                        style={{ color: 'gray' }}
                      />
                      <p style={{ fontSize: '13px', color: 'gray', fontStyle: 'italic' }}>No image</p>
                    </>
                  )}

                  <Upload {...imageUploadProps}>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                    >
                      Click to Upload
                    </Button>
                  </Upload>
                </div>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '-15px' }}>
                  {isModalOpen.question?.is_options == null && !activedMode ? (
                    <div style={{ marginInline: '5px', marginTop: '10px', width: '70%' }}>
                      <RunningAlert />
                    </div>
                  ) : isOptions ? (
                    <h3 style={{ fontWeight: 'normal', fontSize: '15px' }}>
                      <span style={{ fontWeight: 'bold' }}>Options Mode</span>, Change to <span style={{ fontWeight: 'bold' }}>Essay Mode </span>:{' '}
                    </h3>
                  ) : (
                    <h3 style={{ fontWeight: 'normal', fontSize: '15px' }}>
                      <span style={{ fontWeight: 'bold' }}>Essay Mode</span>, Change to <span style={{ fontWeight: 'bold' }}>Options Mode </span>:{' '}
                    </h3>
                  )}

                  <SwitchButton
                    defaultChecked={isOptions}
                    onChange={HandleChangeButtonSwitch}
                  />
                </div>

                {isModalOpen.question?.is_options == null && activedMode ? (
                  <p style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: '300' }}>
                    Mode is <span style={{ color: 'blue' }}>active.</span> You can change to be <span style={{ color: 'blue' }}>Options</span> or <span style={{ color: 'blue' }}>Essay</span> mode.
                  </p>
                ) : null}
              </div>
            </div>
          </Form.Item>
          {isOptions && (
            <>
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
            </>
          )}
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
