import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  Typography,
  Button,
  Table,
  Spin,
  Empty,
  Pagination,
  Space,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  apiGetLearningVideos,
  apiDeleteLearningVideo,
  LearningVideoResponse,
} from "../../api/learningVideo";
import ModalCreateLearningVideo from "./ModalCreateLearningVideo";
import ModalUpdateLearningVideo from "./ModalUpdateLearningVideo";

const { Title, Text } = Typography;
const { Search } = Input;

const LearningVideoScreen = () => {
  const [videos, setVideos] = useState<LearningVideoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingVideo, setCurrentEditingVideo] =
    useState<LearningVideoResponse | null>(null);

  useEffect(() => {
    document.title = "Learning Videos - CMS";
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetLearningVideos(page, pageSize, search);
      if (res?.data?.payload) {
        setVideos(res.data.payload.data);
        setTotal(res.data.payload.total);
      }
    } catch (error) {
      console.error("Error fetching learning videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [page, pageSize, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEdit = (video: LearningVideoResponse) => {
    setCurrentEditingVideo(video);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await apiDeleteLearningVideo(id);
    fetchVideos();
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          <PlayCircleOutlined /> Watch
        </a>
      ),
    },
    {
      title: "Program ID",
      dataIndex: "program_id",
      key: "program_id",
      render: (text: string | null) =>
        text ? (
          <Tag color="blue">{text}</Tag>
        ) : (
          <Tag color="default">No Program</Tag>
        ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => new Date(text).toLocaleDateString(),
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: LearningVideoResponse) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Learning Video"
            description="Are you sure you want to delete this learning video?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col flex="auto">
                <Title level={2} style={{ margin: 0 }}>
                  <PlayCircleOutlined style={{ marginRight: "8px" }} />
                  Learning Videos Management
                </Title>
              </Col>
              <Col>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create Video
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Card>
            <Search
              placeholder="Search by title..."
              onSearch={handleSearch}
              size="large"
              enterButton
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card loading={isLoading}>
            {videos.length === 0 && !isLoading ? (
              <Empty description="No learning videos found" />
            ) : (
              <>
                <Table
                  columns={columns}
                  dataSource={videos}
                  rowKey="id"
                  pagination={false}
                  loading={isLoading}
                />
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={(p, size) => {
                    setPage(p);
                    setPageSize(size);
                  }}
                  style={{ marginTop: "16px", textAlign: "right" }}
                  showSizeChanger
                />
              </>
            )}
          </Card>
        </Col>
      </Row>

      <ModalCreateLearningVideo
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setPage(1);
          fetchVideos();
        }}
      />

      {currentEditingVideo && (
        <ModalUpdateLearningVideo
          open={isEditModalOpen}
          video={currentEditingVideo}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentEditingVideo(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setCurrentEditingVideo(null);
            fetchVideos();
          }}
        />
      )}
    </div>
  );
};

export default LearningVideoScreen;
