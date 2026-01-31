import React, { useState } from "react";
import { Modal, Form, Input, Button, Spin } from "antd";
import {
  apiCreateLearningVideo,
  CreateLearningVideoRequest,
} from "../../api/learningVideo";

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
                pattern: /^https?:\/\/.+/,
                message: "Please enter a valid URL",
              },
            ]}
          >
            <Input placeholder="https://youtube.com/watch?v=..." />
          </Form.Item>

          <Form.Item
            label="Program ID (Optional)"
            name="program_id"
            rules={[
              { min: 3, message: "Program ID must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Enter program ID (leave empty for no program)" />
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
