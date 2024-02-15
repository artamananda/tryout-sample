import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Typography,
  message,
} from "antd";
import type { DatePickerProps, GetProps } from "antd";
import { apiCreateTryout } from "../../api/tryout";
import { getErrorMessage } from "../../helpers/errorHandler";
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { Title } = Typography;

const CreateTryout = () => {
  const handleCreate = async (data: any) => {
    const res = await apiCreateTryout(data);
    if (res) {
      message.success("Create Tryout Success");
    }
  };
  const onFinishFailed = (errorInfo: any) => {
    message.error(getErrorMessage(errorInfo));
  };

  const onChange = (
    value: DatePickerProps["value"] | RangePickerProps["value"],
    dateString: [string, string] | string
  ) => {
    console.log("Selected Time: ", value);
    console.log("Formatted Selected Time: ", dateString);
  };

  const onOk = (
    value: DatePickerProps["value"] | RangePickerProps["value"]
  ) => {
    console.log("onOk: ", value);
  };

  return (
    <div>
      <Title level={3} style={{ fontWeight: "bold" }}>
        Create Tryout
      </Title>
      <Form
        name="createTryout"
        onFinish={handleCreate}
        onFinishFailed={onFinishFailed}
        layout="vertical"
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

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateTryout;
