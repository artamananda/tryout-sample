import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Typography,
  Spin,
  Empty,
  Pagination,
  Button,
  Tag
} from 'antd';
import { PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import {
  apiGetLearningVideos,
  LearningVideoResponse
} from '../../api/learningVideo';

const { Title, Text } = Typography;
const { Search } = Input;

const LearningVideoScreen = () => {
  const [videos, setVideos] = useState<LearningVideoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    document.title = 'Learning Videos';
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
      console.error('Error fetching learning videos:', error);
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

  return (
    <div
      style={{
        padding: '24px',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}
    >
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col span={24}>
          <Card
            style={{
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <div style={{ padding: '20px 0' }}>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                <PlayCircleOutlined style={{ marginRight: '12px' }} />
                Learning Videos
              </Title>
              <Text
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}
              >
                Expand your knowledge with our collection of educational videos
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Search
            placeholder="Search videos by title..."
            onSearch={handleSearch}
            size="large"
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
      </Row>

      {/* Videos Grid */}
      <Spin spinning={isLoading} tip="Loading videos...">
        {videos?.length === 0 && !isLoading ? (
          <Empty
            description="No learning videos found"
            style={{ marginTop: '60px' }}
          />
        ) : (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {videos?.map((video) => (
              <Col key={video.id} xs={24} sm={24} md={8} lg={8}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  cover={
                    <div
                      style={{
                        background: '#000',
                        height: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <PlayCircleOutlined
                        style={{
                          fontSize: '48px',
                          color: '#fff',
                          opacity: 0.8
                        }}
                      />
                    </div>
                  }
                >
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Title
                      level={4}
                      style={{ marginBottom: '8px' }}
                      ellipsis={{ rows: 2 }}
                    >
                      {video.title}
                    </Title>

                    {video.program_id && (
                      <div style={{ marginBottom: '8px' }}>
                        <Tag color="blue">{video.program_id}</Tag>
                      </div>
                    )}

                    <Text
                      type="secondary"
                      style={{ fontSize: '12px', marginBottom: '12px' }}
                    >
                      {new Date(video.created_at).toLocaleDateString()}
                    </Text>

                    <div style={{ marginTop: 'auto' }}>
                      <Button
                        type="primary"
                        block
                        icon={<PlayCircleOutlined />}
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        Watch Now
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* Pagination */}
      {videos?.length > 0 && (
        <Row justify="end" style={{ marginTop: '24px' }}>
          <Col>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, size) => {
                setPage(p);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={['9', '18', '27']}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default LearningVideoScreen;
