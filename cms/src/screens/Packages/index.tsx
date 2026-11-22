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
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  apiCreatePackage,
  apiDeletePackage,
  apiGetProgramPackages,
  apiUpdatePackage,
} from "../../api/package";
import { getErrorMessage } from "../../helpers/errorHandler";
import { formatRupiah, PackageProps } from "../../types/package.type";

const { Title, Text } = Typography;

/**
 * The five packages of the business plan ("Paket Kelas TELISIK CPNS v2").
 * Where the plan contradicts itself, the feature table was followed
 * (study group from Unggulan, certificate from Eksekutif).
 */
const TELISIK_TEMPLATE = [
  { code: "perdana", name: "Perdana", price: 0, normal_value: 10000, tryout_count: 1, has_explanation: false, sort_order: 1,
    description: "1 TO SKD gratis, satu kali per nomor WhatsApp." },
  { code: "premium", name: "Premium", price: 50000, normal_value: 50000, tryout_count: 5, has_explanation: true, sort_order: 2,
    description: "5 TO SKD dengan pembahasan tertulis dan analisis skor." },
  { code: "unggulan", name: "Unggulan", price: 149000, normal_value: 175000, tryout_count: 5, class_count: 5, recording_days: 30,
    has_explanation: true, has_study_group: true, sort_order: 3, description: "5 TO SKD + 5 kelas pembahasan live." },
  { code: "eksekutif", name: "Eksekutif", price: 279000, normal_value: 350000, tryout_count: 10, class_count: 10, recording_days: 60,
    has_explanation: true, has_weekly_report: true, has_study_group: true, has_certificate: true, badge: "Andalan", sort_order: 4,
    description: "10 TO SKD + 10 kelas live + email progres mingguan." },
  { code: "platinum", name: "Platinum", price: 449000, normal_value: 475000, tryout_count: 10, class_count: 10, recording_days: 90,
    mentoring_sessions: 1, has_explanation: true, has_weekly_report: true, has_study_group: true, has_certificate: true, quota: 50,
    sort_order: 5, features: ["Peta kelemahan personal", "Prioritas tanya tutor", "Grup belajar khusus"],
    description: "Isi Eksekutif + mentoring 1:1 + peta kelemahan personal." },
];

type EditorState = { open: boolean; record?: PackageProps };

const PackagesScreen = () => {
  const { programId = "" } = useParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setIsLoading(true);
      setPackages(await apiGetProgramPackages(programId));
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

  const openEditor = (record?: PackageProps) => {
    form.resetFields();
    form.setFieldsValue(
      record
        ? {
            ...record,
            launch_price_until: record.launch_price_until ? dayjs(record.launch_price_until) : undefined,
            features: record.features || [],
          }
        : { is_active: true, has_explanation: true, price: 0, tryout_count: 0, sort_order: packages.length + 1, features: [] }
    );
    setEditor({ open: true, record });
  };

  const save = async () => {
    const values = await form.validateFields();
    const payload: Record<string, unknown> = {
      ...values,
      launch_price_until: values.launch_price_until ? values.launch_price_until.toISOString() : undefined,
      features: values.features || [],
    };
    // Empty optional numbers clear the stored value.
    if (values.launch_price === null || values.launch_price === undefined) {
      delete payload.launch_price;
      delete payload.launch_price_until;
      if (editor.record) payload.clear_launch_price = true;
    }
    if (values.quota === null || values.quota === undefined) {
      delete payload.quota;
      if (editor.record) payload.clear_quota = true;
    }

    try {
      setIsSaving(true);
      if (editor.record) {
        await apiUpdatePackage(editor.record.package_id, payload);
        message.success("Paket diperbarui");
      } else {
        await apiCreatePackage({ ...payload, program_id: programId });
        message.success("Paket dibuat");
      }
      setEditor({ open: false });
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const createTemplate = async () => {
    const existing = new Set(packages.map((pkg) => pkg.code));
    const missing = TELISIK_TEMPLATE.filter((item) => !existing.has(item.code));
    if (missing.length === 0) {
      message.info("Kelima paket sudah ada");
      return;
    }
    try {
      setIsSaving(true);
      for (const item of missing) {
        await apiCreatePackage({ ...item, program_id: programId, is_active: true });
      }
      message.success(`${missing.length} paket dibuat. Periksa harga dan kuota sebelum dibuka.`);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (record: PackageProps, isActive: boolean) => {
    try {
      await apiUpdatePackage(record.package_id, { is_active: isActive });
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const remove = async (record: PackageProps) => {
    try {
      await apiDeletePackage(record.package_id);
      message.success("Paket dihapus");
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const columns: TableProps<PackageProps>["columns"] = [
    { title: "#", dataIndex: "sort_order", width: 50 },
    {
      title: "Paket",
      dataIndex: "name",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {record.name} {record.badge && <Tag color="gold">{record.badge}</Tag>}
          </Text>
          <Text type="secondary">{record.code}</Text>
        </Space>
      ),
    },
    {
      title: "Harga",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.current_price === 0 ? "Gratis" : formatRupiah(record.current_price)}</Text>
          {record.is_launch_price && <Text type="secondary">normal {formatRupiah(record.price)}</Text>}
          {record.price_per_session > 0 && <Text type="secondary">{formatRupiah(record.price_per_session)}/sesi</Text>}
        </Space>
      ),
    },
    {
      title: "Isi",
      render: (_, record) => (
        <Text>
          {record.tryout_count} TO · {record.class_count} kelas · rekaman {record.recording_days} hari
          {record.mentoring_sessions > 0 && ` · ${record.mentoring_sessions} mentoring`}
        </Text>
      ),
    },
    {
      title: "Kuota",
      render: (_, record) =>
        record.quota ? `${record.remaining_quota ?? "-"} / ${record.quota}` : <Text type="secondary">Tanpa batas</Text>,
    },
    {
      title: "Aktif",
      render: (_, record) => <Switch checked={record.is_active} onChange={(checked) => toggleActive(record, checked)} />,
    },
    {
      title: "Aksi",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditor(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Hapus paket?"
            description="Paket yang sudah pernah dipesan tidak bisa dihapus; nonaktifkan saja."
            onConfirm={() => remove(record)}
          >
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          Paket Program
        </Title>
        <Space wrap>
          <Button onClick={() => navigate(`/orders?program_id=${programId}`)}>Lihat Pesanan</Button>
          {packages.length === 0 && (
            <Button loading={isSaving} onClick={createTemplate}>
              Buat 5 paket sesuai dokumen bisnis
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            Tambah Paket
          </Button>
        </Space>
      </div>

      <Table
        style={{ marginTop: 16 }}
        rowKey="package_id"
        loading={isLoading}
        columns={columns}
        dataSource={packages}
        pagination={false}
        scroll={{ x: true }}
      />

      <Modal
        open={editor.open}
        title={editor.record ? `Edit ${editor.record.name}` : "Tambah Paket"}
        onCancel={() => setEditor({ open: false })}
        onOk={save}
        okText="Simpan"
        confirmLoading={isSaving}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item name="code" label="Kode" rules={[{ required: true }]} extra="mis. premium">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="sort_order" label="Urutan / tingkat" extra="Lebih tinggi = paket lebih lengkap">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Deskripsi singkat">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item name="price" label="Harga normal (Rp)" rules={[{ required: true }]}>
                <InputNumber min={0} step={1000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="launch_price" label="Harga peluncuran (Rp)">
                <InputNumber min={0} step={1000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="launch_price_until"
                label="Harga peluncuran sampai"
                dependencies={["launch_price"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const launch = getFieldValue("launch_price");
                      if (launch !== null && launch !== undefined && !value) {
                        return Promise.reject(new Error("Wajib diisi bila ada harga peluncuran"));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker showTime style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="normal_value" label="Nilai normal (coret)" extra="Untuk label Hemat %">
                <InputNumber min={0} step={1000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="quota" label="Kuota" extra="Kosong = tanpa batas">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="badge" label="Label sorotan" extra="mis. Andalan">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={12} md={6}>
              <Form.Item name="tryout_count" label="Jumlah TO" extra="Membuka TO 1..N">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="class_count" label="Kelas live">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="recording_days" label="Rekaman (hari)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="mentoring_sessions" label="Mentoring 1:1">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            {[
              ["has_explanation", "Pembahasan tertulis"],
              ["has_weekly_report", "Email progres mingguan"],
              ["has_study_group", "Grup belajar"],
              ["has_certificate", "Sertifikat"],
              ["is_active", "Aktif (tampil di web)"],
            ].map(([name, label]) => (
              <Col xs={12} md={8} key={name}>
                <Form.Item name={name} label={label} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Form.Item name="features" label="Fitur tambahan" extra="Ketik lalu tekan Enter">
            <Select mode="tags" open={false} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PackagesScreen;
