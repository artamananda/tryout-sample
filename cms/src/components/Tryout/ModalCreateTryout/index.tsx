import {
  Button,
  DatePicker,
  DatePickerProps,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Modal,
  Typography,
} from "antd";
import Title from "antd/es/typography/Title";
import SwitchButton from "../../Ui/SwitchButton";
import { RangePickerProps } from "antd/es/date-picker";
import { useEffect, useState } from "react";
import { apiCreateTryout } from "../../../api/tryout";
import { apiGetBankSoalTypes } from "../../../api/ai";
const { Text } = Typography;

const DEFAULT_DISTRIBUTION_BY_TYPE: Record<string, number> = {
  kpu: 30,
  ppu: 20,
  pbm: 20,
  pku: 15,
  ind: 30,
  ing: 20,
  mtk: 20,
};

type PropTypes = {
  showModal: boolean;
  setShowModal: any;
  onFinishFailed: (errorInfo: any) => void;
  onChange: (
    value: DatePickerProps["value"] | RangePickerProps["value"],
    dateString: [string, string] | string,
  ) => void;
  onOk: (value: DatePickerProps["value"] | RangePickerProps["value"]) => void;
  fetchList: () => void;
};

const ModalCreateTryout = (props: PropTypes) => {
  const { showModal, setShowModal, onFinishFailed, onChange, onOk, fetchList } =
    props;
  const [isPublished, setIsPublished] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [generateFromBankSoal, setGenerateFromBankSoal] = useState(false);
  const [bankSoalTypes, setBankSoalTypes] = useState<string[]>([]);
  const [distributionMap, setDistributionMap] = useState<
    Record<string, number>
  >({});
  const [form] = Form.useForm();

  const buildDefaultDistributionMap = (types: string[]) => {
    return types.reduce<Record<string, number>>((acc, type) => {
      const normalizedType = String(type).toLowerCase();
      acc[type] = DEFAULT_DISTRIBUTION_BY_TYPE[normalizedType] || 0;
      return acc;
    }, {});
  };

  useEffect(() => {
    const fetchTypes = async () => {
      const types = await apiGetBankSoalTypes();
      const resolvedTypes = types || [];
      setBankSoalTypes(resolvedTypes);
      setDistributionMap(buildDefaultDistributionMap(resolvedTypes));
    };

    if (showModal) {
      fetchTypes();
    }
  }, [showModal]);

  const setTypeCount = (type: string, count: number | null) => {
    setDistributionMap((prev) => ({
      ...prev,
      [type]: count || 0,
    }));
  };

  const handleCreate = async (data: any) => {
    const bankSoalDistribution = Object.entries(distributionMap)
      .filter(([, count]) => Number(count) > 0)
      .map(([type, count]) => ({
        type,
        count: Number(count),
      }));

    if (generateFromBankSoal && bankSoalDistribution.length === 0) {
      message.error("Pilih minimal 1 tipe soal dan jumlah soal untuk generate");
      return;
    }

    const newData = {
      ...data,
      is_published: isPublished,
      show_score: showScore,
      generate_from_bank_soal: generateFromBankSoal,
      bank_soal_distribution: bankSoalDistribution,
    };

    const res = await apiCreateTryout(newData);
    if (res) {
      setShowModal(false);
      setGenerateFromBankSoal(false);
      setShowScore(false);
      setDistributionMap({});
      form.resetFields();
      fetchList();
      message.success("Create Tryout Success");
    }
  };
  return (
    <Modal
      open={showModal}
      onCancel={() => setShowModal(false)}
      footer={false}
      width={700}
    >
      <Title level={3} style={{ fontWeight: "bold" }}>
        Create Tryout
      </Title>
      <Form
        name="createTryout"
        onFinish={(values) => {
          Modal.confirm({
            title: "Are you sure?",
            content: `Are you sure you want to create this tryout?`,
            onOk: () => {
              handleCreate(values);
            },
          });
        }}
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
            }}
          />
        </Form.Item>

        <Form.Item label="Show Score to User" name="show_score">
          <SwitchButton
            defaultChecked={showScore}
            onChange={(checked) => {
              setShowScore(checked);
            }}
          />
        </Form.Item>

        <Form.Item label="Generate Soal dari Bank Soal">
          <Space direction="vertical" style={{ width: "100%" }}>
            <SwitchButton
              defaultChecked={generateFromBankSoal}
              onChange={(checked) => setGenerateFromBankSoal(checked)}
            />
            <Text type="secondary">
              Aktifkan untuk langsung membuat soal tryout dari bank soal.
            </Text>
          </Space>
        </Form.Item>

        {generateFromBankSoal && (
          <Form.Item label="Distribusi Soal per Tipe">
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              {bankSoalTypes.length === 0 && (
                <Text type="secondary">Tidak ada tipe bank soal tersedia.</Text>
              )}
              {bankSoalTypes.map((type) => (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Text style={{ minWidth: 120, textTransform: "uppercase" }}>
                    {type}
                  </Text>
                  <InputNumber
                    min={0}
                    value={distributionMap[type] || 0}
                    onChange={(value) => setTypeCount(type, value)}
                    style={{ width: 160 }}
                  />
                </div>
              ))}
            </Space>
          </Form.Item>
        )}

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
