import React from 'react';
import { Image } from 'antd';
import logo from '../../assets/logo.png';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/Auth/LoginForm';
import FooterCopyright from '../../components/Footer';

const { Text, Link } = Typography;

const LoginScreen = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f0f0f0',
        border: '1px solid black'
      }}
    >
      <div style={{ marginBottom: '40px' }}>
        <Image width={250} src={logo} preview={false} />
      </div>
      <LoginForm />
      <Text>
        Don't have an account?{' '}
        <Link onClick={() => navigate('/register')}>Register</Link>
      </Text>
      <div style={{ position: 'absolute', bottom: 0, marginBlock: 20 }}>
        <FooterCopyright />
      </div>
    </div>
  );
};

export default LoginScreen;
