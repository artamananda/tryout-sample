import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Switch,
  DatePicker,
  InputNumber,
  Upload,
  Space,
  Typography,
  Divider,
  Image,
  Tabs,
} from "antd";
import { InboxOutlined, FileImageOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import {
  apiUpdateEbook,
  apiUploadEbookCover,
  apiUploadEbookFile,
  EbookResponse,
  UpdateEbookRequest,
} from "../../api/ebook";

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;

interface Props {
  open: boolean;
  ebook: EbookResponse;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalUpdateEbook: React.FC<Props> = ({ open, ebook, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<RcFile | null>(null);
  const [pdfFile, setPdfFile] = useState<RcFile | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    if (open && ebook) {
      form.setFieldsValue({
        title: ebook.title,
        author: ebook.author,
        description: ebook.description,
        publisher: ebook.publisher,
        publication_date: ebook.publication_date ? dayjs(ebook.publication_date) : null,
        isbn: ebook.isbn,
        total_pages: ebook.total_pages,
        is_published: ebook.is_published,
        category: ebook.category,
      });
    }
  }, [open, ebook, form]);

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      const payload: UpdateEbookRequest = {
        title: values.title,
        author: values.author,
        description: values.description,
        publisher: values.publisher,
        publication_date: values.publication_date
          ? dayjs(values.publication_date).toISOString()
          : undefined,
        isbn: values.isbn,
        total_pages: values.total_pages,
        is_published: values.is_published,
        category: values.category,
      };
      await apiUpdateEbook(ebook.ebook_id, payload);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!coverFile) return;
    setUploadingCover(true);
    try {
      await apiUploadEbookCover(ebook.ebook_id, coverFile);
      setCoverFile(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) return;
    setUploadingPdf(true);
    try {
      await apiUploadEbookFile(ebook.ebook_id, pdfFile);
      setPdfFile(null);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCoverFile(null);
    setPdfFile(null);
    onClose();
  };

  const infoTab = (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
      >
        <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
          Simpan Perubahan
        </Button>
      </Form.Item>
    </Form>
  );

  const filesTab = (
    <div>
      {/* Current Cover */}
      {ebook.cover_image_url && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Cover saat ini:</Text>
          <div style={{ marginTop: 8 }}>
            <Image src={ebook.cover_image_url} height={120} style={{ borderRadius: 6 }} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          <FileImageOutlined style={{ marginRight: 6 }} />
          Ganti Cover
        </Text>
        <Dragger
          accept="image/*"
          maxCount={1}
          beforeUpload={(file) => { setCoverFile(file); return false; }}
          onRemove={() => setCoverFile(null)}
          fileList={coverFile ? [{ uid: "1", name: coverFile.name, status: "done" } as UploadFile] : []}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Klik atau seret gambar cover</p>
          <p className="ant-upload-hint">JPG, PNG, WEBP</p>
        </Dragger>
        {coverFile && (
          <Button
            type="primary"
            style={{ marginTop: 8, width: "100%" }}
            loading={uploadingCover}
            onClick={handleUploadCover}
          >
            Unggah Cover Baru
          </Button>
        )}
      </div>

      <Divider />

      {/* PDF */}
      {ebook.ebook_url && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            File PDF saat ini: <a href={ebook.ebook_url} target="_blank" rel="noreferrer">Lihat PDF</a>
          </Text>
        </div>
      )}
      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          <FilePdfOutlined style={{ marginRight: 6 }} />
          Ganti File PDF
        </Text>
        <Dragger
          accept=".pdf"
          maxCount={1}
          beforeUpload={(file) => { setPdfFile(file); return false; }}
          onRemove={() => setPdfFile(null)}
          fileList={pdfFile ? [{ uid: "2", name: pdfFile.name, status: "done" } as UploadFile] : []}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Klik atau seret file PDF</p>
          <p className="ant-upload-hint">Hanya format PDF</p>
        </Dragger>
        {pdfFile && (
          <Button
            type="primary"
            style={{ marginTop: 8, width: "100%" }}
            loading={uploadingPdf}
            onClick={handleUploadPdf}
          >
            Unggah PDF Baru
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      title={`Edit Ebook: ${ebook.title}`}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Tabs
        items={[
          { key: "info", label: "Informasi Buku", children: infoTab },
          { key: "files", label: "Cover & File PDF", children: filesTab },
        ]}
      />
    </Modal>
  );
};

export default ModalUpdateEbook;
