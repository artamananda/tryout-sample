import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Select,
  Spin,
  Typography,
  Upload,
  UploadProps
} from 'antd';
import './style.css';
import { useEffect, useState } from 'react';
import { httpRequest } from '../../helpers/api';

import { useNavigate, useParams } from 'react-router-dom';
import SuccessRegisterRegister from './Success';
import Outdated from './Outdated';
import { ProgramProps } from '../../types/program.type';
import { useAuthUser } from 'react-auth-kit';
import { UserProperties } from '../../types/user.type';
import axios from 'axios';

const { Text } = Typography;

type ProvinceProps = {
  id: string;
  name: string;
};

type RegencyProps = {
  id: string;
  province_id: string;
  name: string;
};

const RegisterProgramScreen = () => {
  const navigate = useNavigate();
  const { programId } = useParams();
  const getAuthUser = useAuthUser();
  const user = getAuthUser() as UserProperties;
  const [form] = Form.useForm();
  const [program, setProgram] = useState<ProgramProps>();
  const [provinceList, setProvinceList] = useState<ProvinceProps[]>([]);
  const [regencyList, setRegencyList] = useState<RegencyProps[]>([]);
  const [profilePicture, setProfilePicture] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const isOutdated = false;

  const fetchProgram = async () => {
    try {
      setIsFetching(true);
      const res = await httpRequest.get('/program/' + programId);
      if (res.data?.payload) {
        setProgram(res.data.payload);
      }

      const transactionProgram = await httpRequest.get(
        '/transaction-program?program_id=' +
          programId +
          '&user_id=' +
          user.user_id
      );
      if (transactionProgram.data?.payload?.results?.length > 0) {
        setIsSuccess(true);
      }
    } catch (err: any) {
      message.error(err?.response?.data || 'Gagal mengambil data program');
    } finally {
      setIsFetching(false);
    }
  };

  const imageUploadProps: UploadProps = {
    multiple: false,
    accept: 'image/*',
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isImage) {
        message.error('File harus berupa gambar (JPEG/PNG).');
        return Upload.LIST_IGNORE;
      }
      if (!isLt2M) {
        message.error('Ukuran file maksimal 2MB.');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess }) => {
      try {
        setProfilePicture(file);
        onSuccess?.(file);
      } catch (error) {}
    },
    onRemove: () => {
      setProfilePicture(null);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!profilePicture) {
      message.error('Mohon upload foto formal');
      return;
    }

    if (profilePicture.size > 2 * 1024 * 1024) {
      message.error('Ukuran foto formal maksimal 2MB');
      return;
    }
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('name', values.name);
      formData.append('grade', values.grade);
      formData.append('school', values.school);
      formData.append('nisn', values.nisn);
      formData.append('province', values.province);
      formData.append('regency', values.regency);
      formData.append('motivation', values.motivation);
      formData.append('file', profilePicture);
      if (programId) {
        formData.append('program_id', programId);
      } else {
        message.error('Program ID is required');
        return;
      }
      if (user?.user_id) {
        formData.append('user_id', user.user_id);
      } else {
        message.error('User ID is required');
        return;
      }
      await axios.post('/register-program', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        maxContentLength: 2 * 1024 * 1024,
        timeout: 300000
      });
      setIsSuccess(true);
      message.success('Pendaftaran berhasil, silahkan cek email anda');
    } catch (err: any) {
      message.error(
        err?.response?.data ||
          err?.response ||
          'Gagal mendaftar, silahkan hubungi admin'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (programId && user?.user_id) {
      fetchProgram();
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json`)
      .then((response) => response.json())
      .then((provinces: ProvinceProps[]) => setProvinceList(provinces));
  }, [programId, user?.user_id]);

  useEffect(() => {
    const selectedProvince = form.getFieldValue('province');
    if (selectedProvince && provinceList.length > 0) {
      const prov = provinceList.find(
        (province) => province.name === selectedProvince
      );
      if (prov) {
        fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`
        )
          .then((response) => response.json())
          .then((regencies) => setRegencyList(regencies));
      }
    } else {
      setRegencyList([]);
      form.setFieldValue('regency', undefined);
    }
  }, [form.getFieldValue('province'), provinceList]);
  return isFetching ? (
    <Spin />
  ) : isOutdated ? (
    <Outdated />
  ) : isSuccess ? (
    <SuccessRegisterRegister programName={program?.name} />
  ) : (
    <Card className="card">
      <div
        style={{
          fontSize: 20,
          textAlign: 'center',
          marginBottom: 20
        }}
      >
        Pendaftaran {program?.name}
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          ...user
        }}
      >
        <Form.Item
          name={'email'}
          label="Email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please input valid email!' }
          ]}
          normalize={(value) => value?.trim()}
        >
          <Input type="email" inputMode="email" />
        </Form.Item>
        <Form.Item
          name={'name'}
          label="Nama Lengkap"
          rules={[
            { required: true, message: 'Please input your name!' },
            { min: 3, message: 'Nama minimal 3 karakter' }
          ]}
          // normalize={(value) => value?.trim()}
        >
          <Input inputMode="text" />
        </Form.Item>
        <Form.Item
          name={'grade'}
          label="Asal Kelas"
          rules={[{ required: true, message: 'Mohon pilih asal kelas!' }]}
        >
          <Select>
            <Select.Option value="10">10</Select.Option>
            <Select.Option value="11">11</Select.Option>
            <Select.Option value="12">12</Select.Option>
            <Select.Option value="Gap Year">Gap Year</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name={'school'}
          label="Asal Sekolah"
          rules={[
            { required: true, message: 'Please input your school!' },
            { min: 3, message: 'Nama sekolah minimal 3 karakter' }
          ]}
          // normalize={(value) => value?.trim()}
        >
          <Input inputMode="text" />
        </Form.Item>
        <Form.Item
          name={'nisn'}
          label="NISN"
          rules={[
            { required: true, message: 'Please input your NISN!' },
            { len: 10, message: 'NISN must be exactly 10 digits!' },
            {
              pattern: /^\d+$/,
              message: 'NISN hanya boleh angka'
            }
          ]}
        >
          <Input maxLength={10} inputMode="numeric" />
        </Form.Item>
        <Form.Item
          name={'province'}
          label="Asal Provinsi"
          rules={[{ required: true, message: 'Mohon pilih asal provinsi!' }]}
        >
          <Select
            onSelect={(value) => {
              form.setFieldValue('province', value);
              form.setFieldValue('regency', undefined);
            }}
          >
            {provinceList.map((province) => (
              <Select.Option key={province.id} value={province.name}>
                {province.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name={'regency'}
          label="Asal Kabupaten"
          rules={[{ required: true, message: 'Mohon pilih asal kabupaten!' }]}
        >
          <Select disabled={!form.getFieldValue('province')}>
            {regencyList.map((regency) => (
              <Select.Option key={regency.id} value={regency.name}>
                {regency.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name={'motivation'}
          label="Motivasi Mengikuti Telisik"
          rules={[
            { required: true, message: 'Please input your motivation!' },
            { min: 20, message: 'Motivasi minimal 20 karakter' }
          ]}
          // normalize={(value) => value?.trim()}
        >
          <Input.TextArea style={{ height: 100 }} />
        </Form.Item>
        <Form.Item
          name={'profilePicture'}
          label="Foto Formal Berpakaian Sekolah"
        >
          <Upload {...imageUploadProps}>
            <Button type="primary">Click to Upload</Button>
          </Upload>
        </Form.Item>
        <Form.Item
          name={'agreement'}
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Mohon setujui komitmen!'))
            }
          ]}
        >
          <Checkbox>
            <Text style={{ fontStyle: 'italic' }}>
              Saya berkomitmen akan mengikuti kelas belajar dengan tertib dan
              disiplin, selalu melaporkan setiap hasil pelaksanaan tes, dan
              berinfaq melalui TELISIK apabila saya lulus SNPMB 2025
            </Text>
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Button
            style={{ width: '100%', marginTop: 20 }}
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            Daftar
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default RegisterProgramScreen;
