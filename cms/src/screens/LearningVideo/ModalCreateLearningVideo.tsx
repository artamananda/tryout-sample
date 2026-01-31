import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Spin, Select } from "antd";
import {
  apiCreateLearningVideo,
  CreateLearningVideoRequest,
} from "../../api/learningVideo";
import { ProgramProps } from "../../types/program.type";
import useFetchList from "../../hooks/useFetchList";

interface ModalCreateLearningVideoProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCreateLearningVideo: React.FC<ModalCreateLearningVideoProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const { data: programs, isLoading: loadingPrograms } =
    useFetchList<ProgramProps>({
      endpoint: "program",
    });

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (values: CreateLearningVideoRequest) => {
    setIsLoading(true);
    try {
      const payload: CreateLearningVideoRequest = {
        title: values.title,
        url: values.url,
      };

      if (values.program_id) {
        payload.program_id = values.program_id;
      }

      await apiCreateLearningVideo(payload);
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error("Error creating learning video:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create Learning Video"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Spin spinning={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[
              { required: true, message: "Please enter the video title" },
              { min: 3, message: "Title must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Enter video title" />
          </Form.Item>

          <Form.Item
            label="Video URL"
            name="url"
            rules={[
              { required: true, message: "Please enter the video URL" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (validateYouTubeUrl(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Please enter a valid YouTube URL"),
                  );
                },
              },
            ]}
          >
            <Input placeholder="https://youtube.com/watch?v=..." />
          </Form.Item>

          <Form.Item label="Program (Optional)" name="program_id">
            <Select
              allowClear
              placeholder="Select a program"
              loading={loadingPrograms}
              options={programs.map((program: ProgramProps) => ({
                label: `${program.name}`,
                value: program.program_id,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              Create Video
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ModalCreateLearningVideo;
