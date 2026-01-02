import { Modal, Space } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import AIChatView, { AIChatViewProps } from "../../AIChat/AIChatView";

interface ModalAIChatbotProps extends AIChatViewProps {
  isOpen: boolean;
}

const ModalAIChatbot = ({
  isOpen,
  onClose,
  tryoutId,
  questionType,
  onQuestionsCreated,
}: ModalAIChatbotProps) => {
  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: "#8C59F1" }} />
          <span>AI Question Generator</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
      style={{ top: 20 }}
    >
      <div style={{ height: 600 }}>
        <AIChatView
          tryoutId={tryoutId}
          questionType={questionType}
          onQuestionsCreated={onQuestionsCreated}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
};

export default ModalAIChatbot;
