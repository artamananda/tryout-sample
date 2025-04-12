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
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { useEffect } from "react";
import { apiUpdateTryout } from "../../../api/tryout";
import { UpdateTryoutRequest } from "../../../types/tryout.type";

type PropTypes = {
  showModalUpdate: any;
  setShowModalUpdate: any;
  onFinishFailed: (errorInfo: any) => void;
  onChange: (
    value: DatePickerProps["value"] | RangePickerProps["value"],
    dateString: [string, string] | string
  ) => void;
  onOk: (value: DatePickerProps["value"] | RangePickerProps["value"]) => void;
  fetchList: () => void;
};

const ModalUpdateTryout = (props: PropTypes) => {
  const {
    showModalUpdate,
    setShowModalUpdate,
    onFinishFailed,
    onChange,
    onOk,
    fetchList,
  } = props;
  const [updateForm] = Form.useForm();

  useEffect(() => {
    if (showModalUpdate.status) {
      updateForm.setFieldsValue({
        ...showModalUpdate.data,
        start_time: dayjs(showModalUpdate.data.start_time),
        end_time: dayjs(showModalUpdate.data.end_time),
      });
    }
  }, [showModalUpdate, updateForm]);

  const handleUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      const data: UpdateTryoutRequest = {
        ...values,
        is_published: showModalUpdate.data.is_published,
      };
      const res = await apiUpdateTryout(showModalUpdate.data.tryout_id, data);
      if (res) {
        fetchList();
        message.success("Success Update");
        setShowModalUpdate({
          status: false,
          data: {},
        });
      }
    } catch (err) {
      message.error("Failed Update");
    }
  };

  return (
    <Modal
      open={showModalUpdate.status}
      onCancel={() => setShowModalUpdate({ data: {}, status: false })}
      footer={false}
    >
      <Title level={3} style={{ fontWeight: "bold" }}>
        Update Tryout
      </Title>
      <Form
        name="updateTryout"
        onFinish={() => {
          Modal.confirm({
            title: "Are you sure?",
            content: `Are you sure you want to update this tryout?`,
            onOk: () => {
              handleUpdate();
            },
          });
        }}
        onFinishFailed={onFinishFailed}
        layout="vertical"
        form={updateForm}
      >
        <Form.Item
          label="Tryout Name"
          name="title"
          rules={[{ required: true }]}
        >
          <Input defaultValue={showModalUpdate?.data?.title} />
        </Form.Item>

        <Form.Item
          label="Duration (Minutes)"
          name="duration"
          rules={[{ required: true }]}
        >
          <InputNumber defaultValue={showModalUpdate?.data?.duration} />
        </Form.Item>

        <Form.Item
          label="Start Time"
          name="start_time"
          rules={[{ required: true }]}
        >
          <DatePicker
            showTime
            onChange={onChange}
            onOk={onOk}
            defaultValue={dayjs(showModalUpdate?.data?.start_time)}
          />
        </Form.Item>

        <Form.Item
          label="End Time"
          name="end_time"
          rules={[{ required: true }]}
        >
          <DatePicker
            showTime
            onChange={onChange}
            onOk={onOk}
            defaultValue={dayjs(showModalUpdate?.data?.end_time)}
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

export default ModalUpdateTryout;
