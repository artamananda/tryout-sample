import { useEffect, useState, useRef, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useParams, useNavigate } from 'react-router-dom';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { httpRequest } from '../../helpers/api';
import { Spin, Typography, Button, Progress, Tooltip, message } from 'antd';
import {
  ArrowLeftOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  BookOutlined,
  MenuOutlined
} from '@ant-design/icons';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const { Text } = Typography;

type PDFFile = string | File | null;

export default function ReadScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<PDFFile>(null);
  const [title, setTitle] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [visiblePages, setVisiblePages] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toolbarVisible, setToolbarVisible] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseWidth = 680;

  function onDocumentLoadSuccess({ numPages: nextNumPages }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
  }

  const fetchEbookFile = async (ebookId: string) => {
    try {
      const res = await httpRequest.get('/ebook/' + ebookId);
      setFile(res.data.payload.ebook_url);
      setTitle(res.data.payload.title);
    } catch {
      message.error('Gagal memuat file ebook.');
    }
  };

  useEffect(() => {
    if (id) fetchEbookFile(id);
  }, [id]);

  // Track current visible page via scroll
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !numPages) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 300;
    if (nearBottom && visiblePages < numPages) {
      setVisiblePages((prev) => Math.min(prev + 3, numPages));
    }

    // scrollHeight reflects only rendered pages (visiblePages), not numPages.
    // Divide by visiblePages to get which rendered page is on screen.
    const scrollable = scrollHeight - clientHeight;
    const fraction = scrollable > 0 ? scrollTop / scrollable : 0;
    const estimatedPage = Math.max(1, Math.ceil(fraction * visiblePages));
    setCurrentPage(Math.min(estimatedPage, visiblePages));
  }, [numPages, visiblePages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const pageWidth = Math.min(baseWidth * zoom, (typeof window !== 'undefined' ? window.innerWidth - 48 : 640));
  const progress = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#1a1a2e',
        overflow: 'hidden'
      }}
    >
      {/* Top Toolbar */}
      <div style={{
        background: 'linear-gradient(90deg, #04073B 0%, #0c1a6b 100%)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: 56,
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        zIndex: 10
      }}>
        <Tooltip title="Kembali ke Perpustakaan">
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            style={{ color: 'rgba(255,255,255,0.85)' }}
            onClick={() => navigate('/library')}
          />
        </Tooltip>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <BookOutlined style={{ color: '#f6a800', flexShrink: 0 }} />
          <Text style={{ color: '#fff', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title || 'Memuat...'}
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {numPages > 0 && (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, whiteSpace: 'nowrap' }}>
              {currentPage} / {numPages}
            </Text>
          )}

          <Tooltip title="Perkecil">
            <Button
              icon={<ZoomOutOutlined />}
              type="text"
              size="small"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.2).toFixed(1)))}
              disabled={zoom <= 0.5}
            />
          </Tooltip>

          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, minWidth: 36, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Text>

          <Tooltip title="Perbesar">
            <Button
              icon={<ZoomInOutlined />}
              type="text"
              size="small"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))}
              disabled={zoom >= 2}
            />
          </Tooltip>

          <Tooltip title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              type="text"
              size="small"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onClick={toggleFullscreen}
            />
          </Tooltip>

          <Tooltip title={toolbarVisible ? 'Sembunyikan Info' : 'Tampilkan Info'}>
            <Button
              icon={<MenuOutlined />}
              type="text"
              size="small"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onClick={() => setToolbarVisible((v) => !v)}
            />
          </Tooltip>
        </div>
      </div>

      {/* Progress Bar */}
      {numPages > 0 && (
        <div style={{ background: '#04073B', padding: '4px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Progress
              percent={progress}
              showInfo={false}
              strokeColor={{ '0%': '#f6a800', '100%': '#ffcd3c' }}
              trailColor="rgba(255,255,255,0.1)"
              style={{ flex: 1, marginBottom: 0 }}
              size="small"
            />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, whiteSpace: 'nowrap' }}>
              {progress}% dibaca
            </Text>
          </div>
        </div>
      )}

      {/* Bottom Info Bar (collapsible) */}
      {toolbarVisible && numPages > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '6px 20px',
          display: 'flex',
          gap: 20,
          flexShrink: 0,
          flexWrap: 'wrap'
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            Total halaman: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{numPages}</strong>
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            Halaman saat ini: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{currentPage}</strong>
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            Zoom: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{Math.round(zoom * 100)}%</strong>
          </Text>
        </div>
      )}

      {/* PDF Content */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px',
          gap: 16,
          background: '#2d2d44'
        }}
      >
        {!file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <Spin size="large" />
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Memuat dokumen...</Text>
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 60 }}>
                <Spin size="large" />
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Memuat halaman...</Text>
              </div>
            }
            noData={
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>File tidak ditemukan.</Text>
              </div>
            }
          >
            {Array.from(new Array(visiblePages), (_el, index) => (
              <div
                key={`page_${index + 1}`}
                style={{
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: '#fff'
                }}
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  loading={
                    <div style={{ width: pageWidth, height: 400, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Spin />
                    </div>
                  }
                />
              </div>
            ))}
          </Document>
        )}

        {visiblePages < numPages && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 20 }}>
            <Spin />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Memuat halaman berikutnya...</Text>
          </div>
        )}

        {numPages > 0 && visiblePages >= numPages && (
          <div style={{
            textAlign: 'center', padding: '24px 32px',
            background: 'rgba(246,168,0,0.1)', borderRadius: 12,
            border: '1px solid rgba(246,168,0,0.2)', marginTop: 8
          }}>
            <BookOutlined style={{ fontSize: 24, color: '#f6a800', marginBottom: 8 }} />
            <br />
            <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>Anda telah selesai membaca buku ini!</Text>
            <Button
              type="primary"
              style={{ marginTop: 12, background: '#04073B', borderColor: '#04073B' }}
              onClick={() => navigate('/library')}
            >
              Kembali ke Perpustakaan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
