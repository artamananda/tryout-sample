import React from 'react';
import LoginForm from './LoginForm';
import { Image } from 'antd';
import logo from '../../assets/logo.png';

const Login = () => {
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
    </div>
  );
};

export default Login;
