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
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import SuccessRegisterRegister from './Success';
import Outdated from './Outdated';
import { ProgramProps } from '../../types/program.type';
import { useAuthUser } from 'react-auth-kit';
import { UserProperties } from '../../types/user.type';

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
  const [program, setProgram] = useState<ProgramProps>();
  const [selectedProvince, setSelectedProvince] = useState<string>();
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
    } catch (err: any) {
      message.error(err?.response?.data || 'Gagal mengambil data program');
    } finally {
      setIsFetching(false);
    }
  };

  const imageUploadProps: UploadProps = {
    multiple: false,
    customRequest: async ({ file, onSuccess }) => {
      try {
        setProfilePicture(file);
        onSuccess?.(file);
      } catch (error) {}
    }
  };

  const handleSubmit = async (values: any) => {
    if (!values.grade) {
      return message.error('Mohon pilih asal kelas');
    }
    if (!values.province) {
      return message.error('Mohon pilih asal provinsi');
    }
    if (!values.regency) {
      return message.error('Mohon pilih asal kabupaten');
    }
    if (!profilePicture) {
      return message.error('Mohon upload foto formal');
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
      if(user.user_id){
        formData.append('user_id', user.user_id);
      } else {
        message.error('User ID is required');
        return;
      }
      await axios.post('/register-program', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setIsLoading(false);
      setIsSuccess(true);
      message.success('Pendaftaran berhasil, silahkan cek email anda');
    } catch (err: any) {
      setIsLoading(false);
      message.error(
        err?.response?.data || 'Gagal mendaftar, silahkan hubungi admin'
      );
    }
  };

  useEffect(() => {
    fetchProgram();
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json`)
      .then((response) => response.json())
      .then((provinces: ProvinceProps[]) => setProvinceList(provinces));
  }, []);

  useEffect(() => {
    const prov = provinceList.find(
      (province) => province.name === selectedProvince
    );
    if (prov) {
      fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov?.id}.json`
      )
        .then((response) => response.json())
        .then((regencies) => setRegencyList(regencies));
    }
  }, [selectedProvince]);
  return isFetching ? (
    <Spin />
  ) : isOutdated ? (
    <Outdated />
  ) : isSuccess ? (
    <SuccessRegisterRegister />
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
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          ...user
        }}
      >
        <Form.Item required name={'email'} label="Email">
          <Input required type="email" />
        </Form.Item>
        <Form.Item required name={'name'} label="Nama Lengkap">
          <Input required />
        </Form.Item>
        <Form.Item required name={'grade'} label="Asal Kelas">
          <Select>
            <Select.Option value="10">10</Select.Option>
            <Select.Option value="11">11</Select.Option>
            <Select.Option value="12">12</Select.Option>
            <Select.Option value="Gap Year">Gap Year</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item required name={'school'} label="Asal Sekolah">
          <Input required />
        </Form.Item>
        <Form.Item required name={'nisn'} label="NISN">
          <Input required maxLength={10} />
        </Form.Item>
        <Form.Item required name={'province'} label="Asal Provinsi">
          <Select onSelect={(value) => setSelectedProvince(value)}>
            {provinceList.map((province) => (
              <Select.Option key={province.id} value={province.name}>
                {province.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item required name={'regency'} label="Asal Kabupaten">
          <Select disabled={!selectedProvince}>
            {regencyList.map((regency) => (
              <Select.Option key={regency.id} value={regency.name}>
                {regency.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          required
          name={'motivation'}
          label="Motivasi Mengikuti Telisik"
        >
          <Input.TextArea required style={{ height: 100 }} />
        </Form.Item>
        <Form.Item
          required
          name={'profilePicture'}
          label="Foto Formal Berpakaian Sekolah"
        >
          <Upload {...imageUploadProps}>
            <Button type="primary">Click to Upload</Button>
          </Upload>
        </Form.Item>
        <Form.Item required name={'agreement'}>
          <Checkbox required>
            <Text style={{ fontStyle: 'italic' }}>
              Saya berkomitmen akan mengikuti kelas belajar dengan tertib dan
              disiplin, selalu melaporkan setiap hasil pelaksanaan tes, dan
              berinfaq melalui TELISIK apabila saya lulus SNPMB 2025
            </Text>
          </Checkbox>
        </Form.Item>
        <Form.Item required>
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
