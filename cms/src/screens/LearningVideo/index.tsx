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
  apiDeleteLearningVideo,
  LearningVideoResponse,
} from "../../api/learningVideo";
import useFetchList from "../../hooks/useFetchList";
import ModalCreateLearningVideo from "./ModalCreateLearningVideo";
import ModalUpdateLearningVideo from "./ModalUpdateLearningVideo";

const { Title, Text } = Typography;
const { Search } = Input;

const LearningVideoScreen = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingVideo, setCurrentEditingVideo] =
    useState<LearningVideoResponse | null>(null);

  const {
    data: videos,
    isLoading,
    pagination,
    changePage,
    changeLimit,
    setSearch,
    fetchList,
  } = useFetchList<LearningVideoResponse>({
    endpoint: "learning-video",
    limit: 10,
  });

  useEffect(() => {
    document.title = "Learning Videos - CMS";
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    changePage(1, pagination.perPage);
  };

  const handleEdit = (video: LearningVideoResponse) => {
    setCurrentEditingVideo(video);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await apiDeleteLearningVideo(id);
    fetchList();
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
      title: "Program",
      dataIndex: "program_name",
      key: "program_name",
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
            {videos?.length === 0 && !isLoading ? (
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
                  current={pagination.page}
                  pageSize={pagination.perPage}
                  total={pagination.totalData}
                  onChange={(p, size) => {
                    changePage(p, size);
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
          fetchList();
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
            fetchList();
          }}
        />
      )}
    </div>
  );
};

export default LearningVideoScreen;
