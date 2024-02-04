import { Button, DatePicker, Form, Input, Typography } from "antd";
import type { DatePickerProps, GetProps } from "antd";
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { Title } = Typography;

type FieldType = {
  tryoutName: string;
  startTime: Date;
  endTime: Date;
};

const CreateTryout = () => {
  const onFinish = (values: any) => {
    console.log("Success:", values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
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
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        layout="vertical"
      >
        <Form.Item<FieldType>
          label="Tryout Name"
          name="tryoutName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Start Time"
          name="startTime"
          rules={[{ required: true }]}
        >
          <DatePicker showTime onChange={onChange} onOk={onOk} />
        </Form.Item>

        <Form.Item<FieldType>
          label="End Time"
          name="endTime"
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
