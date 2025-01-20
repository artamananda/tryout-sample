import { Card, Typography, Button, Space } from 'antd';
import { SmileOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Outdated = () => {
  return (
    <Card
      style={{
        width: '80vw',
        margin: 'auto',
        marginTop: 100,
        padding: '40px',
        borderRadius: '10px',
        background: 'linear-gradient(to right, #ff7e5f, #feb47b)', // Gradasi warna lembut
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}
      bordered={false}
    >
      <SmileOutlined
        style={{ fontSize: 48, color: '#fff', marginBottom: 20 }}
      />
      <Title level={2} style={{ color: '#fff' }}>
        Halo, pendaftaran program ini sudah ditutup 🙏 Terima kasih atas
        partisipasinya.👋
      </Title>
      <Text style={{ fontSize: '16px', color: '#fff', display: 'block' }}>
        Kami mengapresiasi dukungan Anda. Jangan ragu untuk kembali lagi di
        kesempatan berikutnya!
      </Text>
      <Space direction="vertical" style={{ marginTop: '20px' }}>
        <Button
          type="primary"
          shape="round"
          size="large"
          icon={<CloseCircleOutlined />}
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#ffffff',
            color: '#ff7e5f',
            marginTop: '20px'
          }}
          onClick={() => (window.location.href = '/')}
        >
          Kembali ke Beranda
        </Button>
      </Space>
      <Text
        style={{
          fontSize: '14px',
          color: '#fff',
          display: 'block',
          marginTop: '40px'
        }}
      >
        Salam Hormat, <br />
        Teras Belajar Asik
      </Text>
    </Card>
  );
};

export default Outdated;
