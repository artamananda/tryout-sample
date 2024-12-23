import {
  Button,
  DatePicker,
  DatePickerProps,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
} from "antd";
import Title from "antd/es/typography/Title";
import SwitchButton from "../../Ui/SwitchButton";
import { RangePickerProps } from "antd/es/date-picker";
import { useState } from "react";
import { apiCreateTryout } from "../../../api/tryout";

type PropTypes = {
  showModal: boolean;
  setShowModal: any;
  onFinishFailed: (errorInfo: any) => void;
  onChange: (
    value: DatePickerProps["value"] | RangePickerProps["value"],
    dateString: [string, string] | string
  ) => void;
  onOk: (value: DatePickerProps["value"] | RangePickerProps["value"]) => void;
  fetchList: () => void;
};

const ModalCreateTryout = (props: PropTypes) => {
  const { showModal, setShowModal, onFinishFailed, onChange, onOk, fetchList } =
    props;
  const [isPublished, setIsPublished] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = async (data: any) => {
    const newData = {
      ...data,
      is_published: isPublished,
    };

    const res = await apiCreateTryout(newData);
    if (res) {
      setShowModal(false);
      fetchList();
      message.success("Create Tryout Success");
    }
  };
  return (
    <Modal open={showModal} onCancel={() => setShowModal(false)} footer={false}>
      <Title level={3} style={{ fontWeight: "bold" }}>
        Create Tryout
      </Title>
      <Form
        name="createTryout"
        onFinish={handleCreate}
        onFinishFailed={onFinishFailed}
        initialValues={{ is_published: false }}
        layout="vertical"
        form={form}
      >
        <Form.Item
          label="Tryout Name"
          name="title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Duration (Minutes)"
          name="duration"
          rules={[{ required: true }]}
        >
          <InputNumber />
        </Form.Item>

        <Form.Item
          label="Start Time"
          name="start_time"
          rules={[{ required: true }]}
        >
          <DatePicker showTime onChange={onChange} onOk={onOk} />
        </Form.Item>

        <Form.Item
          label="End Time"
          name="end_time"
          rules={[{ required: true }]}
        >
          <DatePicker showTime onChange={onChange} onOk={onOk} />
        </Form.Item>

        <Form.Item
          label="Published"
          name="is_published"
          // valuePropName="checked"
        >
          <SwitchButton
            defaultChecked={isPublished}
            onChange={(checked) => {
              setIsPublished(checked);
              console.log("Published: ", checked);
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalCreateTryout;
