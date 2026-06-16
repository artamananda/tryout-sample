import { useEffect, useMemo, useState } from 'react';
import { Navigation } from '../../components/Home/Navigation';
import {
  Layout,
  Row,
  Col,
  Card,
  Input,
  Typography,
  Image,
  Button,
  Tag,
  Skeleton,
  Empty,
  Statistic,
  Tooltip
} from 'antd';
import {
  BookOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReadOutlined,
  TeamOutlined,
  GlobalOutlined,
  StarFilled,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { EbookProps } from '../../types/ebook';
import useFetchList from '../../hooks/useFetchList';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const CATEGORY_COLORS: Record<string, string> = {
  Matematika: 'blue',
  Sains: 'green',
  Sejarah: 'orange',
  Bahasa: 'purple',
  Teknologi: 'cyan',
  Ekonomi: 'gold',
  Hukum: 'red',
  Sosial: 'geekblue',
  Agama: 'volcano',
  Seni: 'magenta'
};

function getCategoryColor(category: string): string {
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (category?.toLowerCase().includes(key.toLowerCase())) {
      return CATEGORY_COLORS[key];
    }
  }
  return 'default';
}

type ViewMode = 'grid' | 'list';

const ELibraryScreen = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const {
    data: books,
    setSearch,
    isLoading
  } = useFetchList<EbookProps>({
    endpoint: 'ebook'
  });

  useEffect(() => {
    document.title = 'Perpustakaan Digital Telisik';
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(books.map((b) => b.category).filter(Boolean)));
    return ['Semua', ...cats];
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (activeCategory === 'Semua') return books;
    return books.filter((b) => b.category === activeCategory);
  }, [books, activeCategory]);

  const stats = useMemo(() => ({
    total: books.length,
    categories: categories.length - 1,
    published: books.filter((b) => b.is_published).length
  }), [books, categories]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <Navigation />

      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #04073B 0%, #0c1a6b 60%, #1a3a8f 100%)',
          paddingTop: 110,
          paddingBottom: 60,
          paddingLeft: 24,
          paddingRight: 24,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decorative circles */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -40,
          width: 250, height: 250, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', borderRadius: 20,
            padding: '6px 16px', marginBottom: 20
          }}>
            <GlobalOutlined style={{ color: '#7eb3ff' }} />
            <Text style={{ color: '#7eb3ff', fontSize: 13 }}>Open Access · Bebas Diakses</Text>
          </div>

          <Title level={1} style={{ color: '#fff', marginBottom: 12, fontSize: 'clamp(26px, 4vw, 42px)' }}>
            Perpustakaan Digital Telisik
          </Title>

          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, maxWidth: 600, margin: '0 auto 32px auto' }}>
            Akses ribuan koleksi buku digital secara gratis. Temukan referensi, pelajari ilmu baru,
            dan tingkatkan wawasanmu kapan saja dan di mana saja.
          </Paragraph>

          {/* Search Bar */}
          <div style={{ maxWidth: 560, margin: '0 auto 40px auto' }}>
            <Search
              placeholder="Cari judul buku, penulis, atau kategori..."
              enterButton={<><SearchOutlined /> Cari</>}
              size="large"
              allowClear
              onSearch={(value) => setSearch(value)}
              style={{ borderRadius: 8 }}
            />
          </div>

          {/* Stats */}
          <Row gutter={[32, 16]} justify="center">
            <Col xs={8} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  value={isLoading ? '—' : stats.total}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
                />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Total Koleksi</Text>
              </div>
            </Col>
            <Col xs={8} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  value={isLoading ? '—' : stats.categories}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
                />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Kategori</Text>
              </div>
            </Col>
            <Col xs={8} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  value={isLoading ? '—' : stats.published}
                  prefix={<ReadOutlined />}
                  valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
                />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Tersedia</Text>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Open Access Badge Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #f6a800 0%, #ffcd3c 100%)',
        padding: '10px 24px',
        textAlign: 'center'
      }}>
        <Text style={{ fontWeight: 600, color: '#04073B', fontSize: 13 }}>
          <StarFilled style={{ marginRight: 6 }} />
          Semua koleksi dapat diakses secara gratis — mendukung Open Access &amp; Literasi Digital Indonesia
        </Text>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', width: '100%' }}>

        {/* Filter & View Toggle */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, marginBottom: 28
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((cat) => (
              <Button
                key={cat}
                type={activeCategory === cat ? 'primary' : 'default'}
                size="small"
                onClick={() => setActiveCategory(cat)}
                style={{
                  borderRadius: 20,
                  fontWeight: activeCategory === cat ? 600 : 400,
                  background: activeCategory === cat ? '#04073B' : undefined,
                  borderColor: activeCategory === cat ? '#04073B' : undefined
                }}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tooltip title="Tampilan Grid">
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? '#04073B' : undefined,
                  borderColor: viewMode === 'grid' ? '#04073B' : undefined
                }}
              />
            </Tooltip>
            <Tooltip title="Tampilan List">
              <Button
                icon={<UnorderedListOutlined />}
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? '#04073B' : undefined,
                  borderColor: viewMode === 'list' ? '#04073B' : undefined
                }}
              />
            </Tooltip>
          </div>
        </div>

        {/* Result Count */}
        {!isLoading && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
            Menampilkan <strong>{filteredBooks.length}</strong> koleksi
            {activeCategory !== 'Semua' ? ` dalam kategori "${activeCategory}"` : ''}
          </Text>
        )}

        {/* Book List */}
        {isLoading ? (
          <Row gutter={[20, 20]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col xs={24} sm={12} md={8} lg={6} key={i}>
                <Card style={{ borderRadius: 12 }}>
                  <Skeleton active avatar={{ shape: 'square', size: 160 }} paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : filteredBooks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#888' }}>
                  Tidak ada buku ditemukan. Coba kata kunci atau kategori lain.
                </span>
              }
            />
          </div>
        ) : viewMode === 'grid' ? (
          <Row gutter={[20, 20]}>
            {filteredBooks.map((book) => (
              <Col xs={24} sm={12} md={8} lg={6} key={book.ebook_id}>
                <GridBookCard book={book} onRead={() => navigate(`/library/${book.ebook_id}/read`)} />
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredBooks.map((book) => (
              <ListBookCard key={book.ebook_id} book={book} onRead={() => navigate(`/library/${book.ebook_id}/read`)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ background: '#04073B', padding: '48px 0 0 0' }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px 40px'
        }}>
          {/* Branding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <BookOutlined style={{ color: '#f6a800', fontSize: 20 }} />
              <Title level={5} style={{ color: '#fff', margin: 0, fontSize: 15 }}>
                Perpustakaan Digital Telisik
              </Title>
            </div>
            <Paragraph style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              Pusat layanan perpustakaan digital yang menyediakan akses terbuka ke berbagai koleksi
              buku dan sumber belajar berkualitas.
            </Paragraph>
          </div>

          {/* Layanan */}
          <div>
            <Text style={{ color: '#f6a800', fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Layanan Kami
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Katalog Online (OPAC)', 'Koleksi E-Book Digital', 'Literasi Informasi Digital', 'Akses Terbuka (Open Access)'].map(s => (
                <Text key={s} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  <span style={{ color: '#f6a800', marginRight: 8 }}>›</span>{s}
                </Text>
              ))}
            </div>
          </div>

          {/* Akses Digital */}
          <div>
            <Text style={{ color: '#f6a800', fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Akses Digital
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GlobalOutlined style={{ color: '#f6a800', fontSize: 14 }} />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Tersedia 24/7</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TeamOutlined style={{ color: '#f6a800', fontSize: 14 }} />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Terbuka untuk umum</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ReadOutlined style={{ color: '#f6a800', fontSize: 14 }} />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Mendukung Open Access</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright strip */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 40,
          padding: '16px 24px',
          textAlign: 'center'
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
            © {new Date().getFullYear()} Perpustakaan Digital Telisik &nbsp;·&nbsp; Mendukung Literasi Digital Indonesia
          </Text>
        </div>
      </div>
    </Layout>
  );
};

interface BookCardProps {
  book: EbookProps;
  onRead: () => void;
}

function GridBookCard({ book, onRead }: BookCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 12px 40px rgba(4,7,59,0.18)'
          : '0 2px 12px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer'
      }}
      onClick={onRead}
    >
      {/* Cover */}
      <div style={{
        position: 'relative',
        background: '#f0f4f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        minHeight: 220
      }}>
        {book.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            style={{ maxHeight: 200, borderRadius: 6, objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
            preview={false}
          />
        ) : (
          <div style={{
            width: 120, height: 180, background: 'linear-gradient(135deg, #04073B, #1a3a8f)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BookOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.4)' }} />
          </div>
        )}
        {book.category && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <Tag color={getCategoryColor(book.category)} style={{ borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
              {book.category}
            </Tag>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Title level={5} style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }} ellipsis={{ rows: 2, tooltip: book.title }}>
          {book.title}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {book.author}
        </Text>
        {book.description && (
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 2 }}
            style={{ fontSize: 12, margin: 0, color: '#888' }}
          >
            {book.description}
          </Paragraph>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {book.total_pages > 0 && (
            <Text style={{ fontSize: 11, color: '#aaa' }}>
              <FileTextOutlined style={{ marginRight: 3 }} />{book.total_pages} hal.
            </Text>
          )}
          {book.publication_date && (
            <Text style={{ fontSize: 11, color: '#aaa' }}>
              <CalendarOutlined style={{ marginRight: 3 }} />
              {new Date(book.publication_date).getFullYear()}
            </Text>
          )}
        </div>
      </div>

      {/* Action */}
      <div style={{ padding: '0 16px 16px 16px' }}>
        <Button
          type="primary"
          block
          style={{
            background: '#04073B',
            borderColor: '#04073B',
            borderRadius: 8,
            fontWeight: 600,
            height: 38
          }}
          onClick={(e) => { e.stopPropagation(); onRead(); }}
        >
          <BookOutlined /> Baca Sekarang
        </Button>
      </div>
    </div>
  );
}

function ListBookCard({ book, onRead }: BookCardProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      gap: 20,
      alignItems: 'flex-start',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
      cursor: 'pointer'
    }}
      onClick={onRead}
    >
      <div style={{ flexShrink: 0 }}>
        {book.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            preview={false}
          />
        ) : (
          <div style={{
            width: 80, height: 110,
            background: 'linear-gradient(135deg, #04073B, #1a3a8f)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BookOutlined style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
          <Title level={5} style={{ margin: 0, fontSize: 15 }} ellipsis={{ tooltip: book.title }}>
            {book.title}
          </Title>
          {book.category && (
            <Tag color={getCategoryColor(book.category)} style={{ borderRadius: 10, fontSize: 11 }}>
              {book.category}
            </Tag>
          )}
        </div>
        <Text type="secondary" style={{ fontSize: 13 }}>{book.author}</Text>
        {book.publisher && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
            Penerbit: {book.publisher}
          </Text>
        )}
        {book.description && (
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ fontSize: 13, color: '#888', margin: '8px 0 0 0' }}
          >
            {book.description}
          </Paragraph>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {book.total_pages > 0 && (
            <Text style={{ fontSize: 12, color: '#aaa' }}>
              <FileTextOutlined style={{ marginRight: 3 }} />{book.total_pages} halaman
            </Text>
          )}
          {book.publication_date && (
            <Text style={{ fontSize: 12, color: '#aaa' }}>
              <CalendarOutlined style={{ marginRight: 3 }} />
              {new Date(book.publication_date).getFullYear()}
            </Text>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <Button
          type="primary"
          style={{
            background: '#04073B',
            borderColor: '#04073B',
            borderRadius: 8,
            fontWeight: 600
          }}
          onClick={(e) => { e.stopPropagation(); onRead(); }}
        >
          <BookOutlined /> Baca
        </Button>
      </div>
    </div>
  );
}

export default ELibraryScreen;
