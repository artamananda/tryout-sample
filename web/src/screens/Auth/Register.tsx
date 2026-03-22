import React from 'react';
import { Image } from 'antd';
import logo from '../../assets/logo.png';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SafetyCertificateOutlined, StarOutlined } from '@ant-design/icons';
import RegisterForm from '../../components/Auth/RegisterForm';
import FooterCopyright from '../../components/Footer';
import './Register.css';

const { Text, Link } = Typography;

const RegisterScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="register-page">
      <div className="register-bg register-bg-left" />
      <div className="register-bg register-bg-right" />

      <div className="register-shell">
        <div className="register-hero">
          <Text className="register-kicker">Buat akun baru</Text>
          <h1>Mulai perjalanan belajarmu sekarang</h1>
          <p>
            Daftar gratis untuk mengakses tryout, bank soal, serta evaluasi
            progres belajar yang terstruktur.
          </p>
          <div className="register-note-list">
            <div className="register-note-item">
              <SafetyCertificateOutlined />
              <span>Akun aman dengan verifikasi OTP email.</span>
            </div>
            <div className="register-note-item">
              <StarOutlined />
              <span>Desain pembelajaran berfokus pada peningkatan nilai.</span>
            </div>
          </div>
        </div>

        <div className="register-card-wrap">
          <div className="register-card">
            <Image
              className="register-logo"
              width={210}
              src={logo}
              preview={false}
            />
            <h2>Daftar Akun</h2>
            <Text className="register-subtitle">
              Lengkapi data berikut untuk membuat akun belajar.
            </Text>

            <RegisterForm />

            <Text className="register-link-row">
              Sudah punya akun?{' '}
              <Link onClick={() => navigate('/login')}>Masuk di sini</Link>
            </Text>
          </div>
        </div>
      </div>

      <div className="register-footer">
        <FooterCopyright />
      </div>
    </div>
  );
};

export default RegisterScreen;
