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
  Tag,
  Select
} from 'antd';
import { PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { LearningVideoResponse } from '../../api/learningVideo';
import { ProgramProps } from '../../types/program.type';
import useFetchList from '../../hooks/useFetchList';
import { useAuthUser } from 'react-auth-kit';

const { Title, Text } = Typography;
const { Search } = Input;

const LearningVideoScreen = () => {
  const [selectedVideo, setSelectedVideo] =
    useState<LearningVideoResponse | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );

  const user = useAuthUser();

  const { data: programs, isLoading: loadingPrograms } =
    useFetchList<ProgramProps>({
      endpoint: 'program',
      fetchable: user()?.user_id !== null,
      initialQuery: {
        user_id: user()?.user_id || ''
      }
    });

  const {
    data: videos,
    isLoading: videosLoading,
    pagination,
    changePage,
    setQuery,
    setSearch
  } = useFetchList<LearningVideoResponse>({
    endpoint: 'learning-video',
    fetchable: selectedProgramId !== null,
    limit: 25,
    initialQuery: {
      search: '',
      program_id: selectedProgramId
    }
  });

  useEffect(() => {
    if (selectedProgramId !== null) {
      setQuery((prev) => ({
        ...prev,
        program_id: selectedProgramId,
        offset: 0
      }));
    }
  }, [selectedProgramId]);

  useEffect(() => {
    document.title = 'Learning Videos';
  }, []);

  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      let videoId: string | null = null;

      // Handle youtube.com URLs
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      }
      // Handle youtu.be short URLs
      else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.substring(1);
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (error) {
      console.error('Invalid URL:', url);
    }
    return null;
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    changePage(1, pagination.perPage);
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

      {/* Program Selector */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col>
                <Text strong>Select Program:</Text>
              </Col>
              <Col flex="auto">
                <Select
                  placeholder="Choose a program to view learning videos"
                  loading={loadingPrograms}
                  value={selectedProgramId}
                  onChange={(value) => {
                    setSelectedProgramId(value);
                  }}
                  style={{ width: '100%' }}
                  options={programs?.map((program: ProgramProps) => ({
                    label: `${program.name}`,
                    value: program.program_id
                  }))}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Search */}
      {selectedProgramId && (
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
      )}

      {/* Show message when no program selected */}
      {!selectedProgramId && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Empty
              description="Please select a program to view learning videos"
              style={{ marginTop: '60px' }}
            />
          </Col>
        </Row>
      )}

      {/* Videos Grid */}
      {selectedProgramId && (
        <Spin spinning={videosLoading} tip="Loading videos...">
          {videos?.length === 0 && !videosLoading ? (
            <Empty
              description="No learning videos found"
              style={{ marginTop: '60px' }}
            />
          ) : (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {videos?.map((video) => {
                  const embedUrl = getYouTubeEmbedUrl(video.url);
                  return (
                    <Col key={video.id} xs={24} sm={24} md={8} lg={8}>
                      <Card
                        hoverable
                        style={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedVideo(video)}
                        cover={
                          embedUrl ? (
                            <div
                              style={{
                                background: '#000',
                                height: '200px',
                                overflow: 'hidden',
                                position: 'relative'
                              }}
                            >
                              <iframe
                                width="100%"
                                height="200"
                                src={`${embedUrl}?controls=0`}
                                title={video.title}
                                style={{
                                  border: 'none',
                                  pointerEvents: 'none'
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              ></iframe>
                            </div>
                          ) : (
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
                          )
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

                          {video.program_name && (
                            <div style={{ marginBottom: '8px' }}>
                              <Tag color="blue">{video.program_name}</Tag>
                            </div>
                          )}

                          <div style={{ marginTop: 20 }}>
                            <Button
                              type="primary"
                              block
                              icon={<PlayCircleOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVideo(video);
                              }}
                            >
                              Watch Now
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
              {selectedVideo && (
                <Card
                  title={selectedVideo.title}
                  style={{ marginTop: '24px' }}
                  extra={
                    <Button type="text" onClick={() => setSelectedVideo(null)}>
                      Close
                    </Button>
                  }
                >
                  {getYouTubeEmbedUrl(selectedVideo.url) ? (
                    <div
                      style={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden'
                      }}
                    >
                      <iframe
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        src={getYouTubeEmbedUrl(selectedVideo.url)!}
                        title={selectedVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open video in new window
                    </a>
                  )}
                </Card>
              )}
            </>
          )}
        </Spin>
      )}

      {/* Pagination */}
      {selectedProgramId && videos?.length > 0 && (
        <Row justify="end" style={{ marginTop: '24px' }}>
          <Col>
            <Pagination
              current={pagination.page}
              pageSize={pagination.perPage}
              total={pagination.totalData}
              onChange={(p, size) => {
                changePage(p, size);
              }}
              showSizeChanger
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default LearningVideoScreen;
