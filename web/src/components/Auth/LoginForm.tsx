import React from 'react';
import { Button, Form, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import useAuthApp from '../../hooks/useAuthApp';

const LoginForm = () => {
  const { isAuthLoading, doLogin } = useAuthApp();

  return (
    <Form
      name="basic"
      className="login-form"
      layout="vertical"
      requiredMark={false}
      onFinish={doLogin}
      autoComplete="off"
    >
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, message: 'Email wajib diisi.' }]}
      >
        <Input
          size="large"
          prefix={<UserOutlined className="site-form-item-icon" />}
          type="email"
          placeholder="contoh@email.com"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="Kata sandi"
        rules={[{ required: true, message: 'Kata sandi wajib diisi.' }]}
      >
        <Input.Password
          size="large"
          prefix={<LockOutlined className="site-form-item-icon" />}
          placeholder="Masukkan kata sandi"
        />
      </Form.Item>

      <Form.Item>
        <Button
          className="login-submit-btn"
          type="primary"
          htmlType="submit"
          loading={isAuthLoading}
          size="large"
          block
        >
          Masuk
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
