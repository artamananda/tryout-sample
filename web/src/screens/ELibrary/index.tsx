import { useEffect } from 'react';
import { Navigation } from '../../components/Home/Navigation';
import {
  Layout,
  Row,
  Col,
  Card,
  Input,
  Typography,
  Image,
  message
} from 'antd';
import { BookOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph } = Typography;
const { Search } = Input;

// Dummy data buku
const books = [
  {
    id: 1,
    title: 'Dari Nol ke Goal: Mimpi Gratisan ala TELISIK',
    coverUrl:
      'https://penerbitlitnus.co.id/wp-content/uploads/2025/06/3064.jpg',
    author:
      'Eogenie Lakilaki, S.E., Artamananda, S.Kom, Annisa Fatihah Salsabila, S.Pd., Dwiki Ariefandri, S.E., Carin Amanda, Shafa Athiya Novila, Dea Dayu Frisilia, Panca Wijaya',
    publisher: 'PT Literasi Nusantara Abadi Grup'
  },
  {
    id: 2,
    title: 'Dari Nol ke Goal: Mimpi Gratisan ala TELISIK',
    coverUrl:
      'https://penerbitlitnus.co.id/wp-content/uploads/2025/06/3064.jpg',
    author:
      'Eogenie Lakilaki, S.E., Artamananda, S.Kom, Annisa Fatihah Salsabila, S.Pd., Dwiki Ariefandri, S.E., Carin Amanda, Shafa Athiya Novila, Dea Dayu Frisilia, Panca Wijaya',
    publisher: 'PT Literasi Nusantara Abadi Grup'
  },
  {
    id: 3,
    title: 'Dari Nol ke Goal: Mimpi Gratisan ala TELISIK',
    coverUrl:
      'https://penerbitlitnus.co.id/wp-content/uploads/2025/06/3064.jpg',
    author:
      'Eogenie Lakilaki, S.E., Artamananda, S.Kom, Annisa Fatihah Salsabila, S.Pd., Dwiki Ariefandri, S.E., Carin Amanda, Shafa Athiya Novila, Dea Dayu Frisilia, Panca Wijaya',
    publisher: 'PT Literasi Nusantara Abadi Grup'
  }
];

const ELibraryScreen = () => {
  useEffect(() => {
    document.title = 'Perpustakaan Digital Telisik';
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      <div
        style={{
          padding: '40px 24px',
          maxWidth: 1200,
          margin: '0 auto',
          marginTop: 80
        }}
      >
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <Title level={2}>📚 Perpustakaan Digital Telisik</Title>
          <Paragraph
            type="secondary"
            style={{ maxWidth: 600, margin: '0 auto' }}
          >
            Jelajahi koleksi buku digital kami. Temukan buku favoritmu dan mulai
            membaca!
          </Paragraph>
        </div>

        <div style={{ maxWidth: 400, margin: '0 auto 32px auto' }}>
          <Search
            placeholder="Cari judul atau penulis..."
            enterButton="Cari"
            size="large"
            onSearch={(value) => {
              console.log('Pencarian:', value);
              // Implementasi pencarian bisa ditambahkan di sini
            }}
          />
        </div>

        <Row gutter={[24, 24]}>
          {books.map((book) => (
            <Col xs={24} sm={12} md={8} lg={8} key={book.id}>
              <Card
                // title={book.title}
                hoverable
                actions={[
                  <span
                    key="read"
                    onClick={() =>
                      message.info('Fitur baca masih dalam pengembangan')
                    }
                  >
                    <BookOutlined /> Baca
                  </span>
                ]}
                style={{
                  borderRadius: 8,
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <Title
                  level={4}
                  style={{ marginBottom: 12, textAlign: 'center' }}
                >
                  {book.title}
                </Title>
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    style={{
                      borderRadius: 8,
                      marginBottom: 12
                    }}
                    height={200}
                  />
                </div>
                <p style={{ marginBottom: 8 }}>
                  <strong>Penulis:</strong> {book.author}
                </p>
                <p style={{ marginBottom: 8 }}>
                  <strong>Penerbit:</strong> {book.publisher}
                </p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Layout>
  );
};

export default ELibraryScreen;
