import React from 'react';
import { Image } from 'antd';
import logo from '../../assets/logo.png';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  RocketOutlined,
  TeamOutlined
} from '@ant-design/icons';
import LoginForm from '../../components/Auth/LoginForm';
import FooterCopyright from '../../components/Footer';
import './Login.css';

const { Text, Link } = Typography;

const LoginScreen = () => {
  const navigate = useNavigate();

  const highlights = [
    {
      icon: <RocketOutlined />,
      title: 'Tryout adaptif',
      description:
        'Soal dirancang untuk bantu kamu belajar lebih fokus dan efektif.'
    },
    {
      icon: <TeamOutlined />,
      title: 'Komunitas aktif',
      description:
        'Belajar bareng ribuan peserta lain dan lihat progres secara real-time.'
    },
    {
      icon: <CheckCircleOutlined />,
      title: 'Evaluasi terukur',
      description:
        'Pantau peningkatan nilai lewat analisis hasil yang mudah dipahami.'
    }
  ];

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-shell">
        <div className="login-hero">
          <Text className="login-kicker">Platform persiapan tryout</Text>
          <h1>Masuk dan lanjutkan progres belajarmu</h1>
          <p>
            Satu akun untuk mengakses paket soal, pembahasan mendalam, dan
            statistik perkembangan harian.
          </p>

          <div className="login-highlights">
            {highlights.map((item) => (
              <div className="login-highlight" key={item.title}>
                <span className="login-highlight-icon">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-card-wrap">
          <div className="login-card">
            <Image
              className="login-logo"
              width={210}
              src={logo}
              preview={false}
            />
            <h2>Selamat datang kembali</h2>
            <Text className="login-subtitle">
              Masuk untuk melanjutkan sesi latihan dan pantau kemajuanmu.
            </Text>

            <LoginForm />

            <Text className="login-link-row">
              Belum punya akun?{' '}
              <Link onClick={() => navigate('/register')}>Daftar sekarang</Link>
            </Text>
            <Text className="login-link-row">
              <Link onClick={() => navigate('/forgot-password')}>
                Lupa kata sandi?
              </Link>
            </Text>
          </div>
        </div>
      </div>

      <div className="login-footer">
        <FooterCopyright />
      </div>
    </div>
  );
};

export default LoginScreen;
