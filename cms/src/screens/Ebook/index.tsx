import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  Typography,
  Button,
  Table,
  Space,
  Popconfirm,
  Tag,
  Image,
  Switch,
  message,
} from "antd";
import {
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { apiDeleteEbook, apiGetEbooks, apiUpdateEbook, EbookResponse } from "../../api/ebook";
import useFetchList from "../../hooks/useFetchList";
import ModalCreateEbook from "./ModalCreateEbook";
import ModalUpdateEbook from "./ModalUpdateEbook";

const { Title, Text } = Typography;
const { Search } = Input;

const EbookScreen = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<EbookResponse | null>(null);

  const {
    data: ebooks,
    isLoading,
    setSearch,
    fetchList,
  } = useFetchList<EbookResponse>({
    endpoint: "ebook",
  });

  useEffect(() => {
    document.title = "Manajemen Ebook - CMS";
  }, []);

  const handleTogglePublish = async (ebook: EbookResponse, checked: boolean) => {
    try {
      await apiUpdateEbook(ebook.ebook_id, { is_published: checked });
      fetchList();
    } catch {
      // error handled in apiUpdateEbook
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteEbook(id);
      fetchList();
    } catch {
      // error handled in apiDeleteEbook
    }
  };

  const columns = [
    {
      title: "Cover",
      dataIndex: "cover_image_url",
      key: "cover",
      width: 72,
      render: (url: string, record: EbookResponse) =>
        url ? (
          <Image
            src={url}
            alt={record.title}
            width={48}
            height={64}
            style={{ objectFit: "cover", borderRadius: 4 }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 64,
              background: "#f0f4f8",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOutlined style={{ color: "#ccc" }} />
          </div>
        ),
    },
    {
      title: "Judul",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: EbookResponse) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            {record.author}
          </div>
        </div>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (text: string) =>
        text ? <Tag color="blue">{text}</Tag> : <Tag color="default">—</Tag>,
    },
    {
      title: "Halaman",
      dataIndex: "total_pages",
      key: "total_pages",
      width: 90,
      render: (n: number) => (n ? `${n} hal.` : "—"),
    },
    {
      title: "Publik",
      dataIndex: "is_published",
      key: "is_published",
      width: 90,
      render: (val: boolean, record: EbookResponse) => (
        <Switch
          size="small"
          checked={val}
          onChange={(checked) => handleTogglePublish(record, checked)}
        />
      ),
    },
    {
      title: "File",
      key: "files",
      width: 80,
      render: (_: any, record: EbookResponse) => (
        <Space direction="vertical" size={2}>
          {record.ebook_url ? (
            <Tag color="green" style={{ fontSize: 10 }}>PDF ✓</Tag>
          ) : (
            <Tag color="red" style={{ fontSize: 10 }}>PDF ✗</Tag>
          )}
          {record.cover_image_url ? (
            <Tag color="green" style={{ fontSize: 10 }}>Cover ✓</Tag>
          ) : (
            <Tag color="orange" style={{ fontSize: 10 }}>Cover ✗</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      width: 160,
      render: (_: any, record: EbookResponse) => (
        <Space>
          {record.ebook_url && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              href={`${import.meta.env.VITE_WEB_URL || ""}/library/${record.ebook_id}/read`}
              target="_blank"
            >
              Lihat
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingEbook(record);
              setIsEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus ebook ini?"
            description="Tindakan ini tidak dapat dibatalkan."
            onConfirm={() => handleDelete(record.ebook_id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  <BookOutlined style={{ marginRight: 8 }} />
                  Manajemen Ebook
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Kelola koleksi perpustakaan digital
                </Text>
              </Col>
              <Col>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Tambah Ebook
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Search
              placeholder="Cari judul atau penulis..."
              onSearch={(val) => setSearch(val)}
              size="large"
              allowClear
              enterButton
            />
          </Card>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Card>
            <Table
              columns={columns}
              dataSource={ebooks}
              rowKey="ebook_id"
              loading={isLoading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              locale={{ emptyText: "Belum ada ebook. Tambahkan ebook pertama Anda!" }}
            />
          </Card>
        </Col>
      </Row>

      <ModalCreateEbook
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchList();
        }}
      />

      {editingEbook && (
        <ModalUpdateEbook
          open={isEditOpen}
          ebook={editingEbook}
          onClose={() => {
            setIsEditOpen(false);
            setEditingEbook(null);
          }}
          onSuccess={() => {
            setIsEditOpen(false);
            setEditingEbook(null);
            fetchList();
          }}
        />
      )}
    </div>
  );
};

export default EbookScreen;
