import React, { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Modal, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import useAuthApp from '../../hooks/useAuthApp';
import { InputOTP } from 'antd-input-otp';

const { Text, Link } = Typography;

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
      'Username hanya boleh huruf, angka, atau underscore.'
    );
  };

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

  const handleFormSubmit = handleResendOtp;

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
    <div>
      <Form
        form={form}
        name="basic"
        className="register-form"
        layout="vertical"
        requiredMark={false}
        onFinish={handleFormSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email wajib diisi.' },
            {
              type: 'email',
              message: 'Format email tidak valid.'
            }
          ]}
        >
          <Input
            size="large"
            prefix={<UserOutlined className="site-form-item-icon" />}
            type="email"
            placeholder="contoh@email.com"
          />
        </Form.Item>
        <Form.Item
          name="name"
          label="Nama"
          rules={[{ required: true, message: 'Nama wajib diisi.' }]}
        >
          <Input
            size="large"
            prefix={<UserOutlined className="site-form-item-icon" />}
            type="name"
            placeholder="Nama lengkap"
          />
        </Form.Item>
        <Form.Item
          name="username"
          label="Username"
          rules={[
            {
              required: true,
              message: 'Username wajib diisi.'
            },
            {
              validator: validateUsername
            }
          ]}
        >
          <Input
            size="large"
            prefix={<UserOutlined className="site-form-item-icon" />}
            type="username"
            placeholder="username_kamu"
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
            className="register-submit-btn"
            type="primary"
            htmlType="submit"
            loading={isAuthLoading}
            size="large"
            block
          >
            Daftar
          </Button>
        </Form.Item>
      </Form>

      <Modal
        open={isShowModal}
        wrapClassName="register-otp-modal"
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
            <Text className="register-otp-modal-title">Verifikasi Email</Text>
            <Divider style={{ marginTop: 10 }} />
            <div style={{ paddingInline: '5%', textAlign: 'center' }}>
              <Text>
                Cek inbox kamu. Kode OTP sudah dikirim ke{' '}
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
                Tunggu{' '}
                <span style={{ fontWeight: 'bold' }}>{`00:${
                  countdown < 10 ? '0' + countdown : countdown
                }`}</span>{' '}
                sebelum kirim ulang OTP
              </Text>
            </div>
          </div>
          <Divider />
          <div className="register-otp-actions">
            <Button
              onClick={handleResendOtp}
              type="link"
              disabled={countdown > 0}
            >
              Kirim Ulang OTP
            </Button>
            <Form.Item>
              <Button htmlType="submit" type="primary" loading={isAuthLoading}>
                Verifikasi OTP
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RegisterForm;
