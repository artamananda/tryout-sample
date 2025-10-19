import { useEffect, useState, useRef, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useParams } from 'react-router-dom';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { httpRequest } from '../../helpers/api';
import { message, Spin, Typography } from 'antd';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const { Title } = Typography;

type PDFFile = string | File | null;

export default function ReadScreen() {
  const { id } = useParams();
  const [file, setFile] = useState<PDFFile>(null);
  const [title, setTitle] = useState<string>('');
  const [numPages, setNumPages] = useState<number>();
  const [visiblePages, setVisiblePages] = useState<number>(3); // Start with 3 pages
  const [pageWidth, setPageWidth] = useState<number>(window.innerWidth);

  const containerRef = useRef<HTMLDivElement | null>(null);

  function onDocumentLoadSuccess({
    numPages: nextNumPages
  }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
  }

  const fetchEbookFile = async (ebookId: string) => {
    try {
      const res = await httpRequest.get('/ebook/' + ebookId);
      const ebookUrl = res.data.payload.ebook_url;
      setFile(ebookUrl);
      setTitle(res.data.payload.title);
    } catch (error) {
      message.error('Gagal memuat file ebook.');
    }
  };

  // Update page width on window resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.offsetWidth);
      }
    };

    window.addEventListener('resize', updateWidth);
    updateWidth(); // Initial

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (id) {
      fetchEbookFile(id);
    }
  }, [id]);

  // Scroll handler for lazy loading
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !numPages) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 200;

    if (nearBottom && visiblePages < numPages) {
      setVisiblePages((prev) => Math.min(prev + 3, numPages));
    }
  }, [numPages, visiblePages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <div style={{ backgroundColor: '#2b3c8a', padding: '10px 20px' }}>
        <Title level={5} style={{ margin: 0, color: '#fff' }}>
          {title}
        </Title>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px'
        }}
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<Spin />}
          noData={<Spin />}
        >
          {Array.from(new Array(visiblePages), (_el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={pageWidth > 500 ? 500 : pageWidth - 40}
              loading={<Spin />}
            />
          ))}
        </Document>

        {visiblePages < (numPages || 0) && (
          <Spin style={{ marginTop: 20 }} tip="Memuat halaman berikutnya..." />
        )}
      </div>
    </div>
  );
}
