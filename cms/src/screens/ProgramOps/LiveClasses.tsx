import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
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
import { ArrowLeftOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import {
  apiCreateLiveClass,
  apiDeleteLiveClass,
  apiGetLiveClasses,
  apiGetProgramTryouts,
  apiUpdateLiveClass,
  LiveClass,
} from "../../api/programOps";
import { getErrorMessage } from "../../helpers/errorHandler";

const { Title, Text } = Typography;

// Defaults from the business plan: classes Mon/Wed/Fri 19.45-22.45 WIB, tutors in rotation.
const DEFAULT_TUTORS = ["Artamananda", "Annisa Fatihah Salsabila", "Eogenie Lakilaki", "Mafazah"];
const WEEKDAYS = [
  { label: "Senin", value: 1 },
  { label: "Selasa", value: 2 },
  { label: "Rabu", value: 3 },
  { label: "Kamis", value: 4 },
  { label: "Jumat", value: 5 },
  { label: "Sabtu", value: 6 },
  { label: "Minggu", value: 0 },
];

/** "2026-11-30" + "19:45" in WIB as an ISO timestamp. */
const wibISO = (date: string, time: string) => `${date}T${time}:00+07:00`;

type Tryout = { tryout_id: string; title: string; program_id?: string; sequence?: number };

const LiveClassesScreen = () => {
  const { programId = "" } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; record?: LiveClass }>({ open: false });
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();
  const [generator] = Form.useForm();

  const load = async () => {
    try {
      setIsLoading(true);
      const [list, allTryouts] = await Promise.all([apiGetLiveClasses(programId), apiGetProgramTryouts()]);
      setClasses(list);
      setTryouts(allTryouts.filter((tryout) => tryout.program_id === programId));
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

  const openEditor = (record?: LiveClass) => {
    form.resetFields();
    form.setFieldsValue(
      record
        ? { ...record, starts_at: dayjs(record.starts_at), ends_at: dayjs(record.ends_at), tryout_id: record.tryout_id || undefined }
        : { sequence: classes.length + 1 }
    );
    setEditing({ open: true, record });
  };

  const save = async () => {
    const values = await form.validateFields();
    const payload: Record<string, unknown> = {
      ...values,
      starts_at: (values.starts_at as Dayjs).toISOString(),
      ends_at: (values.ends_at as Dayjs).toISOString(),
      meeting_url: values.meeting_url || "",
      recording_url: values.recording_url || "",
    };
    try {
      setIsSaving(true);
      if (editing.record) {
        if (!values.tryout_id) {
          delete payload.tryout_id;
          payload.clear_tryout = true;
        }
        await apiUpdateLiveClass(editing.record.class_id, payload);
      } else {
        await apiCreateLiveClass({ ...payload, program_id: programId });
      }
      message.success("Kelas disimpan");
      setEditing({ open: false });
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const generate = async () => {
    const values = await generator.validateFields();
    const days: number[] = values.days;
    let date: Dayjs = values.first_date;
    const tutors: string[] = values.tutors || [];
    const existing = new Set(classes.map((item) => item.sequence));
    const plans: Record<string, unknown>[] = [];
    let sequence = values.first_sequence;
    // Walk forward day by day and place a class on every selected weekday.
    const lastSequence = values.first_sequence + values.count;
    for (let guard = 0; sequence < lastSequence && guard < 400; guard++) {
      if (days.includes(date.day())) {
        if (!existing.has(sequence)) {
          const day = date.format("YYYY-MM-DD");
          const tryout = tryouts.find((item) => item.sequence === sequence);
          plans.push({
            program_id: programId,
            sequence,
            title: `${values.title_prefix} ${sequence}`.trim(),
            tutor_name: tutors.length ? tutors[(sequence - values.first_sequence) % tutors.length] : "",
            starts_at: wibISO(day, values.start_time),
            ends_at: wibISO(day, values.end_time),
            tryout_id: tryout?.tryout_id,
          });
        }
        sequence++;
      }
      date = date.add(1, "day");
    }
    try {
      setIsSaving(true);
      for (const plan of plans) {
        await apiCreateLiveClass(plan);
      }
      message.success(`${plans.length} kelas dibuat. Isi link meeting sebelum kelas dimulai.`);
      setGeneratorOpen(false);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
      load();
    } finally {
      setIsSaving(false);
    }
  };

  const columns: TableProps<LiveClass>["columns"] = [
    { title: "#", dataIndex: "sequence", width: 50 },
    {
      title: "Kelas",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.title}</Text>
          <Text type="secondary">{row.tutor_name || "-"}</Text>
          {row.tryout_id && <Text type="secondary">Membahas {tryouts.find((item) => item.tryout_id === row.tryout_id)?.title || "TO"}</Text>}
        </Space>
      ),
    },
    {
      title: "Waktu (WIB)",
      render: (_, row) => `${dayjs(row.starts_at).format("ddd DD MMM YYYY HH:mm")}–${dayjs(row.ends_at).format("HH:mm")}`,
    },
    {
      title: "Link",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Tag color={row.meeting_url ? "green" : "red"}>{row.meeting_url ? "Meeting siap" : "Meeting belum ada"}</Tag>
          <Tag color={row.recording_url ? "green" : "default"}>{row.recording_url ? "Rekaman ada" : "Rekaman belum"}</Tag>
        </Space>
      ),
    },
    { title: "Hadir", render: (_, row) => row.attendees ?? 0 },
    {
      title: "Rating",
      render: (_, row) => (row.rating_count ? `${row.rating_avg} (${row.rating_count})` : "-"),
    },
    {
      title: "Aksi",
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEditor(row)}>
            Edit
          </Button>
          <Popconfirm title="Hapus kelas ini?" onConfirm={async () => {
            try {
              await apiDeleteLiveClass(row.class_id);
              load();
            } catch (err) {
              message.error(getErrorMessage(err));
            }
          }}>
            <Button size="small" danger>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate("/program")} style={{ paddingLeft: 0 }}>
        Program
      </Button>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          Kelas Live
        </Title>
        <Space wrap>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => {
              generator.setFieldsValue({
                first_date: dayjs("2026-11-30"),
                first_sequence: classes.length + 1,
                count: 10,
                days: [1, 3, 5],
                start_time: "19:45",
                end_time: "22:45",
                tutors: DEFAULT_TUTORS,
                title_prefix: "Pembahasan TO",
              });
              setGeneratorOpen(true);
            }}
          >
            Buat jadwal otomatis
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            Tambah Kelas
          </Button>
        </Space>
      </div>
      <Text type="secondary">
        Peserta melihat link meeting mulai 30 menit sebelum kelas. Rekaman tampil sesuai masa rekaman paket, dihitung dari tanggal kelas.
      </Text>

      <Table style={{ marginTop: 16 }} rowKey="class_id" loading={isLoading} columns={columns} dataSource={classes} pagination={false} scroll={{ x: true }} />

      <Modal open={editing.open} title={editing.record ? "Edit Kelas" : "Tambah Kelas"} onOk={save} onCancel={() => setEditing({ open: false })} confirmLoading={isSaving} okText="Simpan" destroyOnClose>
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="sequence" label="Kelas ke-" rules={[{ required: true }]} extra="Paket membuka kelas 1..N">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item name="title" label="Judul" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tutor_name" label="Tutor">
            <Input />
          </Form.Item>
          <Form.Item name="tryout_id" label="TO yang dibahas">
            <Select allowClear options={tryouts.map((tryout) => ({ value: tryout.tryout_id, label: tryout.title }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="starts_at" label="Mulai" rules={[{ required: true }]}>
                <DatePicker showTime format="DD MMM YYYY HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ends_at" label="Selesai" rules={[{ required: true }]}>
                <DatePicker showTime format="DD MMM YYYY HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="meeting_url" label="Link meeting (Zoom/Meet)" rules={[{ type: "url", message: "Harus URL lengkap (https://...)" }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="recording_url" label="Link rekaman" rules={[{ type: "url", message: "Harus URL lengkap (https://...)" }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="description" label="Catatan untuk peserta">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={generatorOpen} title="Buat jadwal kelas otomatis" onOk={generate} onCancel={() => setGeneratorOpen(false)} confirmLoading={isSaving} okText="Buat">
        <Form form={generator} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="first_date" label="Mulai dari tanggal" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="first_sequence" label="Kelas ke-" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="count" label="Jumlah" rules={[{ required: true }]}>
                <InputNumber min={1} max={50} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="days" label="Hari" rules={[{ required: true }]}>
            <Checkbox.Group options={WEEKDAYS} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="start_time" label="Jam mulai (WIB)" rules={[{ required: true, pattern: /^\d{2}:\d{2}$/ }]}>
                <Input placeholder="19:45" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="Jam selesai (WIB)" rules={[{ required: true, pattern: /^\d{2}:\d{2}$/ }]}>
                <Input placeholder="22:45" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tutors" label="Rotasi tutor" extra="Bergiliran sesuai urutan">
            <Select mode="tags" />
          </Form.Item>
          <Form.Item name="title_prefix" label="Judul">
            <Input />
          </Form.Item>
          <Text type="secondary">Kelas ke-k otomatis dihubungkan ke TO ke-k bila TO-nya sudah dibuat.</Text>
        </Form>
      </Modal>
    </div>
  );
};

export default LiveClassesScreen;
