import React from 'react';
import { Image } from 'antd';
import logo from '../../assets/logo.png';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import ForgotPasswordForm from '../../components/Auth/ForgotPasswordForm';
import FooterCopyright from '../../components/Footer';
import './ForgotPassword.css';

const { Text, Link } = Typography;

const ForgotPasswordScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="forgot-page">
      <div className="forgot-bg forgot-bg-left" />
      <div className="forgot-bg forgot-bg-right" />

      <div className="forgot-shell">
        <div className="forgot-hero">
          <Text className="forgot-kicker">Reset akun</Text>
          <h1>Atur ulang kata sandi dengan aman</h1>
          <p>
            Masukkan email aktif kamu, lalu verifikasi OTP untuk membuat kata
            sandi baru dan lanjut belajar.
          </p>
          <div className="forgot-note-list">
            <div className="forgot-note-item">
              <SafetyCertificateOutlined />
              <span>Verifikasi OTP untuk menjaga keamanan akun kamu.</span>
            </div>
            <div className="forgot-note-item">
              <KeyOutlined />
              <span>
                Proses cepat, langsung kembali ke dashboard setelah reset.
              </span>
            </div>
          </div>
        </div>

        <div className="forgot-card-wrap">
          <div className="forgot-card">
            <Image
              className="forgot-logo"
              width={210}
              src={logo}
              preview={false}
            />
            <h2>Lupa Kata Sandi</h2>
            <Text className="forgot-subtitle">
              Ikuti langkah verifikasi untuk mengganti password akunmu.
            </Text>

            <ForgotPasswordForm />

            <Text className="forgot-link-row">
              Ingat password kamu?{' '}
              <Link onClick={() => navigate('/login')}>Kembali ke Masuk</Link>
            </Text>
          </div>
        </div>
      </div>

      <div className="forgot-footer">
        <FooterCopyright />
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
