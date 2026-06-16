import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Switch,
  DatePicker,
  InputNumber,
  Upload,
  Steps,
  Space,
  Typography,
  Divider,
} from "antd";
import {
  InboxOutlined,
  CheckCircleOutlined,
  FileImageOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import {
  apiCreateEbook,
  apiUploadEbookCover,
  apiUploadEbookFile,
  CreateEbookRequest,
  EbookResponse,
} from "../../api/ebook";

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCreateEbook: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [createdEbook, setCreatedEbook] = useState<EbookResponse | null>(null);
  const [coverFile, setCoverFile] = useState<RcFile | null>(null);
  const [pdfFile, setPdfFile] = useState<RcFile | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handleCreate = async (values: any) => {
    setIsLoading(true);
    try {
      const payload: CreateEbookRequest = {
        title: values.title,
        author: values.author,
        description: values.description,
        publisher: values.publisher,
        publication_date: values.publication_date
          ? dayjs(values.publication_date).toISOString()
          : undefined,
        isbn: values.isbn,
        total_pages: values.total_pages,
        is_published: values.is_published ?? false,
        category: values.category,
      };
      const res = await apiCreateEbook(payload);
      if (res?.data?.payload) {
        setCreatedEbook(res.data.payload);
        setStep(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!coverFile || !createdEbook) return;
    setUploadingCover(true);
    try {
      await apiUploadEbookCover(createdEbook.ebook_id, coverFile);
      setCoverFile(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile || !createdEbook) return;
    setUploadingPdf(true);
    try {
      await apiUploadEbookFile(createdEbook.ebook_id, pdfFile);
      setPdfFile(null);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleFinish = () => {
    form.resetFields();
    setStep(0);
    setCreatedEbook(null);
    setCoverFile(null);
    setPdfFile(null);
    onSuccess();
  };

  const handleCancel = () => {
    form.resetFields();
    setStep(0);
    setCreatedEbook(null);
    setCoverFile(null);
    setPdfFile(null);
    onClose();
  };

  return (
    <Modal
      title="Tambah Ebook Baru"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Steps
        current={step}
        items={[{ title: "Informasi Buku" }, { title: "Unggah File" }]}
        style={{ marginBottom: 24 }}
        size="small"
      />

      {step === 0 && (
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Judul"
            name="title"
            rules={[{ required: true, message: "Judul wajib diisi" }]}
          >
            <Input placeholder="Masukkan judul buku" />
          </Form.Item>

          <Form.Item
            label="Penulis"
            name="author"
            rules={[{ required: true, message: "Penulis wajib diisi" }]}
          >
            <Input placeholder="Nama penulis" />
          </Form.Item>

          <Form.Item label="Deskripsi" name="description">
            <TextArea rows={3} placeholder="Deskripsi singkat buku" />
          </Form.Item>

          <Space style={{ width: "100%" }} size={16}>
            <Form.Item label="Penerbit" name="publisher" style={{ flex: 1 }}>
              <Input placeholder="Nama penerbit" />
            </Form.Item>
            <Form.Item label="Kategori" name="category" style={{ flex: 1 }}>
              <Input placeholder="Contoh: Matematika, Sains" />
            </Form.Item>
          </Space>

          <Space style={{ width: "100%" }} size={16}>
            <Form.Item label="ISBN" name="isbn" style={{ flex: 1 }}>
              <Input placeholder="ISBN" />
            </Form.Item>
            <Form.Item label="Jumlah Halaman" name="total_pages" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </Space>

          <Form.Item label="Tanggal Terbit" name="publication_date">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Publikasikan"
            name="is_published"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              Buat & Lanjut ke Upload File
            </Button>
          </Form.Item>
        </Form>
      )}

      {step === 1 && createdEbook && (
        <div>
          <div
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
            <Text>
              Ebook <strong>{createdEbook.title}</strong> berhasil dibuat.
              Sekarang unggah cover dan file PDF-nya.
            </Text>
          </div>

          {/* Cover Upload */}
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              <FileImageOutlined style={{ marginRight: 6 }} />
              Gambar Cover (opsional)
            </Text>
            <Dragger
              accept="image/*"
              maxCount={1}
              beforeUpload={(file) => {
                setCoverFile(file);
                return false;
              }}
              onRemove={() => setCoverFile(null)}
              fileList={
                coverFile
                  ? [{ uid: "1", name: coverFile.name, status: "done" } as UploadFile]
                  : []
              }
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Klik atau seret gambar cover ke sini</p>
              <p className="ant-upload-hint">JPG, PNG, WEBP · Maks 5MB</p>
            </Dragger>
            {coverFile && (
              <Button
                type="primary"
                style={{ marginTop: 8, width: "100%" }}
                loading={uploadingCover}
                onClick={handleUploadCover}
              >
                Unggah Cover
              </Button>
            )}
          </div>

          <Divider />

          {/* PDF Upload */}
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              <FilePdfOutlined style={{ marginRight: 6 }} />
              File PDF (opsional)
            </Text>
            <Dragger
              accept=".pdf"
              maxCount={1}
              beforeUpload={(file) => {
                setPdfFile(file);
                return false;
              }}
              onRemove={() => setPdfFile(null)}
              fileList={
                pdfFile
                  ? [{ uid: "2", name: pdfFile.name, status: "done" } as UploadFile]
                  : []
              }
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Klik atau seret file PDF ke sini</p>
              <p className="ant-upload-hint">Hanya format PDF</p>
            </Dragger>
            {pdfFile && (
              <Button
                type="primary"
                style={{ marginTop: 8, width: "100%" }}
                loading={uploadingPdf}
                onClick={handleUploadPdf}
              >
                Unggah PDF
              </Button>
            )}
          </div>

          <Button type="primary" block size="large" onClick={handleFinish}>
            Selesai
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ModalCreateEbook;
