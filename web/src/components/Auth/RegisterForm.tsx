import React, { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Modal, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import useAuthApp from '../../hooks/useAuthApp';
import { InputOTP } from 'antd-input-otp';

const { Text, Link } = Typography;

const RegisterForm = () => {
  const [form] = Form.useForm();
  const { isAuthLoading, doSendOtpEmail, doRegister } = useAuthApp();
  const [data, setData] = useState<{
    email: string;
    username: string;
    name: string;
    password: string;
    otp: string;
  }>({
    email: '',
    username: '',
    name: '',
    password: '',
    otp: ''
  });
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

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const handleResendOtp = async () => {
    const result = await doSendOtpEmail(data);
    if (result !== 1) {
      setCountdown(59);
      setIsShowModal(true);
    }
  };

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
    <div style={{ minWidth: '50vw' }}>
      <Form
        name="basic"
        layout="vertical"
        onFinish={handleResendOtp}
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
            onChange={(e) => setData({ ...data, email: e.target.value })}
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
            onChange={(e) => setData({ ...data, name: e.target.value })}
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
            onChange={(e) => setData({ ...data, username: e.target.value })}
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
            onChange={(e) => setData({ ...data, password: e.target.value })}
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
        onCancel={() => {
          setIsShowModal(false);
        }}
      >
        <Form
          form={form}
          onFinish={doRegister}
          initialValues={{
            ...data,
            otp: otp?.join('') || '',
            otpInput: otp
          }}
        >
          <div>
            <Text style={{ fontWeight: 'bold' }}>Email Verification</Text>
            <Divider style={{ marginTop: 10 }} />
            <div style={{ paddingInline: 60, textAlign: 'center' }}>
              <Text>
                Check your inbox. We've sent you the OTP verification code to{' '}
                <Link>{data?.email}</Link>
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
