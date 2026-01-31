import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Spin } from "antd";
import {
  apiUpdateLearningVideo,
  UpdateLearningVideoRequest,
  LearningVideoResponse,
} from "../../api/learningVideo";

interface ModalUpdateLearningVideoProps {
  open: boolean;
  video: LearningVideoResponse;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalUpdateLearningVideo: React.FC<ModalUpdateLearningVideoProps> = ({
  open,
  video,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && video) {
      form.setFieldsValue({
        title: video.title,
        url: video.url,
        program_id: video.program_id || undefined,
      });
    }
  }, [open, video, form]);

  const handleSubmit = async (values: UpdateLearningVideoRequest) => {
    setIsLoading(true);
    try {
      await apiUpdateLearningVideo(video.id, values);
      onSuccess();
    } catch (error) {
      console.error("Error updating learning video:", error);
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
      title="Update Learning Video"
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
              Update Video
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ModalUpdateLearningVideo;
