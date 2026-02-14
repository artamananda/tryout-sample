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
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Title level={3} style={{ textAlign: 'center', marginBottom: 10 }}>
        Forgot Password
      </Title>
      <Text
        type="secondary"
        style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}
      >
        {currentStep === 0
          ? 'Enter your email to receive OTP'
          : 'Enter OTP and new password'}
      </Text>

      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 24 }}
        items={[{ title: 'Email' }, { title: 'Reset Password' }]}
      />

      {currentStep === 0 ? (
        <Form form={form} onFinish={handleSendOtp} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Send OTP
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Form form={form} onFinish={handleResetPassword} layout="vertical">
          <Form.Item
            name="otp"
            label="Enter OTP"
            rules={[
              { required: true, message: 'Please enter the OTP!' },
              {
                validator: (_, value) => {
                  if (
                    value &&
                    value.length === 6 &&
                    value.every((v: string) => v)
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Please enter a valid 6-digit OTP');
                }
              }
            ]}
          >
            <InputOTP type="numeric" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New Password"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Passwords do not match!');
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Button
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
              Resend OTP
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
