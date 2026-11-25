import { useEffect, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import {
  apiCreateMentoringSlots,
  apiDeleteMentoringSlot,
  apiGetMentoringSlots,
  apiUpdateMentoringSlot,
  MentoringSlot,
} from "../../api/programOps";
import { getErrorMessage } from "../../helpers/errorHandler";
import UserName from "../../components/kit/UserName";

const { Title, Text, Link } = Typography;

const STATUS_COLOR: Record<string, string> = {
  OPEN: "blue",
  BOOKED: "gold",
  DONE: "green",
  NO_SHOW: "red",
  CANCELLED: "default",
};

const MentoringScreen = () => {
  const { programId = "" } = useParams();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<MentoringSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setIsLoading(true);
      setSlots(await apiGetMentoringSlots(programId));
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const create = async () => {
    const values = await form.validateFields();
    // Every Saturday (or the chosen weekday) starting from the first date.
    const dates: string[] = [];
    let date: Dayjs = values.first_date;
    for (let i = 0; i < values.weeks; i++) {
      dates.push(date.format("YYYY-MM-DD"));
      date = date.add(7, "day");
    }
    try {
      setIsSaving(true);
      const result = await apiCreateMentoringSlots({
        program_id: programId,
        dates,
        times: values.times,
        tutors: values.tutors,
        duration_minutes: values.duration_minutes,
        meeting_url: values.meeting_url || "",
      });
      message.success(`${result.created} slot dibuat (slot yang sudah ada dilewati).`);
      setCreatorOpen(false);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const update = async (slot: MentoringSlot, data: Record<string, unknown>) => {
    try {
      await apiUpdateMentoringSlot(slot.slot_id, data);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const editLink = (slot: MentoringSlot) => {
    let link = slot.meeting_url || "";
    Modal.confirm({
      title: "Link sesi mentoring",
      content: <Input defaultValue={link} placeholder="https://..." onChange={(event) => (link = event.target.value)} />,
      okText: "Simpan",
      onOk: () => update(slot, { meeting_url: link }),
    });
  };

  const columns: TableProps<MentoringSlot>["columns"] = [
    { title: "Waktu (WIB)", render: (_, row) => `${dayjs(row.starts_at).format("ddd DD MMM YYYY HH:mm")} · ${row.duration_minutes} menit` },
    { title: "Tutor", dataIndex: "tutor_name" },
    {
      title: "Peserta",
      render: (_, row) =>
        row.booked_by ? (
          <Space direction="vertical" size={0}>
            <UserName userId={row.booked_by.user_id} name={row.booked_by.name} />
            <Text type="secondary">{row.booked_by.email}</Text>
            {row.booked_by.phone_number && (
              <Link href={`https://wa.me/${row.booked_by.phone_number}`} target="_blank" rel="noreferrer">
                {row.booked_by.phone_number}
              </Link>
            )}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Status",
      render: (_, row) => (
        <Select
          size="small"
          value={row.status}
          style={{ width: 130 }}
          onChange={(status) => update(row, { status })}
          options={["OPEN", "BOOKED", "DONE", "NO_SHOW", "CANCELLED"].map((value) => ({
            value,
            label: <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
            disabled: !row.booked_by && ["BOOKED", "DONE", "NO_SHOW"].includes(value),
          }))}
        />
      ),
    },
    {
      title: "Link",
      render: (_, row) => (
        <Button size="small" onClick={() => editLink(row)}>
          {row.meeting_url ? "Ubah link" : "Isi link"}
        </Button>
      ),
    },
    {
      title: "",
      render: (_, row) =>
        row.booked_by ? null : (
          <Popconfirm title="Hapus slot?" onConfirm={async () => {
            try {
              await apiDeleteMentoringSlot(row.slot_id);
              load();
            } catch (err) {
              message.error(getErrorMessage(err));
            }
          }}>
            <Button size="small" danger>
              Hapus
            </Button>
          </Popconfirm>
        ),
    },
  ];

  const booked = slots.filter((slot) => slot.booked_by).length;

  return (
    <div>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate("/program")} style={{ paddingLeft: 0 }}>
        Program
      </Button>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          Mentoring 1:1
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.setFieldsValue({
              first_date: dayjs("2026-12-05"),
              weeks: 3,
              times: ["09:00", "10:00"],
              tutors: ["Artamananda", "Annisa Fatihah Salsabila", "Eogenie Lakilaki", "Mafazah"],
              duration_minutes: 30,
            });
            setCreatorOpen(true);
          }}
        >
          Buat Slot
        </Button>
      </div>
      <Text type="secondary">
        {slots.length} slot · {booked} dipesan. Tandai DONE setelah sesi berlangsung supaya masuk laporan fee tutor.
      </Text>

      <Table style={{ marginTop: 16 }} rowKey="slot_id" loading={isLoading} columns={columns} dataSource={slots} scroll={{ x: true }} />

      <Modal open={creatorOpen} title="Buat slot mentoring" onOk={create} onCancel={() => setCreatorOpen(false)} confirmLoading={isSaving} okText="Buat">
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="first_date" label="Tanggal pertama" rules={[{ required: true }]} extra="Diulang tiap 7 hari">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="weeks" label="Jumlah minggu" rules={[{ required: true }]}>
                <InputNumber min={1} max={20} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="times" label="Jam mulai (WIB, HH:MM)" rules={[{ required: true }]}>
            <Select mode="tags" />
          </Form.Item>
          <Form.Item name="tutors" label="Tutor" rules={[{ required: true }]}>
            <Select mode="tags" />
          </Form.Item>
          <Form.Item name="duration_minutes" label="Durasi (menit)" rules={[{ required: true }]}>
            <InputNumber min={10} max={180} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="meeting_url" label="Link meeting (opsional, bisa diisi per slot)" rules={[{ type: "url" }]}>
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MentoringScreen;
