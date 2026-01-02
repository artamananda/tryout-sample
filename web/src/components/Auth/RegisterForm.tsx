import React, { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Modal, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import useAuthApp from '../../hooks/useAuthApp';
import { InputOTP } from 'antd-input-otp';

const { Text, Link } = Typography;

// OTP Bypass mode - set to true to skip OTP verification
const IS_OTP_BYPASS = true;

const RegisterForm = () => {
  const [form] = Form.useForm();
  const { isAuthLoading, doSendOtpEmail, doRegister } = useAuthApp();
  const [countdown, setCountdown] = useState(0);
  const [isShowModal, setIsShowModal] = useState(false);
  const [otp, setOtp] = useState<string[]>();

  const validateUsername = (rule: any, value: string) => {
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!value || regex.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(
      'Username should only contain letters, numbers, or underscores.'
    );
  };

  const onFinishFailed = (errorInfo: any) => {};

  const handleResendOtp = async () => {
    const formData = form.getFieldsValue([
      'email',
      'username',
      'name',
      'password'
    ]);
    const result = await doSendOtpEmail(formData);
    if (result !== 1) {
      setCountdown(59);
      setIsShowModal(true);
    }
  };

  // Direct registration handler (bypasses OTP)
  const handleDirectRegister = async () => {
    const formData = form.getFieldsValue([
      'email',
      'username',
      'name',
      'password'
    ]);
    // Add dummy OTP for bypass mode
    await doRegister({ ...formData, otp: '000000' });
  };

  // Choose handler based on bypass mode
  const handleFormSubmit = IS_OTP_BYPASS
    ? handleDirectRegister
    : handleResendOtp;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    form.setFieldValue('otp', otp?.join('') || '');
  }, [otp]);
  return (
    <div style={{ width: '100%', maxWidth: '600px', padding: '0 16px' }}>
      <Form
        form={form}
        name="basic"
        layout="vertical"
        onFinish={handleFormSubmit}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input your email!' },
            {
              type: 'email',
              message: 'The input is not valid email!'
            }
          ]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            type="email"
            placeholder="Email"
          />
        </Form.Item>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input your name!' }]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            type="name"
            placeholder="Name"
          />
        </Form.Item>
        <Form.Item
          name="username"
          label="Username"
          rules={[
            {
              required: true,
              message: 'Please input your username!'
            },
            {
              validator: validateUsername
            }
          ]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            type="username"
            placeholder="Username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            style={{ width: '100%' }}
            type="primary"
            htmlType="submit"
            loading={isAuthLoading}
          >
            Register
          </Button>
        </Form.Item>
      </Form>

      <Modal
        open={isShowModal}
        footer={false}
        width="90%"
        style={{ maxWidth: '500px' }}
        centered
        onCancel={() => {
          setIsShowModal(false);
        }}
      >
        <Form form={form} onFinish={doRegister}>
          <div>
            <Text style={{ fontWeight: 'bold' }}>Email Verification</Text>
            <Divider style={{ marginTop: 10 }} />
            <div style={{ paddingInline: '5%', textAlign: 'center' }}>
              <Text>
                Check your inbox. We've sent you the OTP verification code to{' '}
                <Link>{form.getFieldValue('email')}</Link>
              </Text>
            </div>
            <div style={{ marginBlock: 20 }}>
              <Form.Item name="email" hidden />
              <Form.Item name="name" hidden />
              <Form.Item name="username" hidden />
              <Form.Item name="password" hidden />
              <Form.Item name="otp" hidden>
                <Input value={otp?.join('') || ''} />
              </Form.Item>
              <Form.Item name="otpInput">
                <InputOTP onChange={(val) => setOtp(val)} />
              </Form.Item>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text>
                Please wait{' '}
                <span style={{ fontWeight: 'bold' }}>{`00:${
                  countdown < 10 ? '0' + countdown : countdown
                }`}</span>{' '}
                before resend another OTP
              </Text>
            </div>
          </div>
          <Divider />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            <Button
              onClick={handleResendOtp}
              type="link"
              disabled={countdown > 0}
            >
              Resend OTP
            </Button>
            <Form.Item>
              <Button htmlType="submit" type="primary" loading={isAuthLoading}>
                Submit OTP
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RegisterForm;
