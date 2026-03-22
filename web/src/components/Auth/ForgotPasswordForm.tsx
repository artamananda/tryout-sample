import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Steps } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { InputOTP } from 'antd-input-otp';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ForgotPasswordForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/forgot-password/send-otp`,
        { email: values.email }
      );

      if (response.data.code === 200) {
        message.success('OTP has been sent to your email');
        setEmail(values.email);
        setCurrentStep(1);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: {
    otp: string[];
    new_password: string;
    confirm_password: string;
  }) => {
    if (values.new_password !== values.confirm_password) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const otpString = values.otp.join('');
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/forgot-password/reset`,
        {
          email: email,
          otp: otpString,
          new_password: values.new_password
        }
      );

      if (response.data.code === 200) {
        message.success('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
          'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-form">
      <Title
        level={3}
        style={{ textAlign: 'center', marginBottom: 10, color: '#153c88' }}
      >
        Lupa Password
      </Title>
      <Text
        type="secondary"
        style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}
      >
        {currentStep === 0
          ? 'Masukkan email untuk menerima OTP'
          : 'Masukkan OTP dan password baru'}
      </Text>

      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 24 }}
        items={[{ title: 'Email' }, { title: 'Reset Password' }]}
      />

      {currentStep === 0 ? (
        <Form
          form={form}
          onFinish={handleSendOtp}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email wajib diisi.' },
              { type: 'email', message: 'Format email tidak valid.' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="contoh@email.com"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Button
              className="forgot-primary-btn"
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Kirim OTP
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Form
          form={form}
          onFinish={handleResetPassword}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="otp"
            label="Masukkan OTP"
            rules={[
              { required: true, message: 'OTP wajib diisi.' },
              {
                validator: (_, value) => {
                  if (
                    value &&
                    value.length === 6 &&
                    value.every((v: string) => v)
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Masukkan OTP 6 digit yang valid.');
                }
              }
            ]}
          >
            <InputOTP type="numeric" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Password Baru"
            rules={[
              { required: true, message: 'Password baru wajib diisi.' },
              { min: 6, message: 'Password minimal 6 karakter.' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Masukkan password baru"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Konfirmasi Password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Konfirmasi password wajib diisi.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Konfirmasi password tidak sama.');
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Ulangi password baru"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Button
              className="forgot-primary-btn"
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Reset Password
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              type="link"
              size="large"
              block
              onClick={() => setCurrentStep(0)}
              disabled={loading}
            >
              Kirim Ulang OTP
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
