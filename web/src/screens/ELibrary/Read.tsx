import { useEffect, useState } from 'react';
// import { useResizeObserver } from '@wojtekmaj/react-hooks';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useParams } from 'react-router-dom';
import './Read.css';

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { httpRequest } from '../../helpers/api';
import { message } from 'antd';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
  wasmUrl: '/wasm/'
};

type PDFFile = string | File | null;

export default function ReadScreen() {
  const { id } = useParams();
  const [file, setFile] = useState<PDFFile>('');
  const [title, setTitle] = useState<string>('');
  const [numPages, setNumPages] = useState<number>();

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

  useEffect(() => {
    if (id) {
      fetchEbookFile(id);
    }
  }, [id]);

  return (
    <div className="Example">
      <header>
        <h1>{title}</h1>
      </header>
      <div className="Example__container">
        <div className="Example__container__document">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            options={options}
          >
            {Array.from(new Array(numPages), (_el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
