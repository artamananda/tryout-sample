import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Select,
  Typography,
  Upload,
  UploadProps
} from 'antd';
import './style.css';
import { useEffect, useState } from 'react';
import { httpRequest } from '../../helpers/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

const Batch5 = () => {
  const navigate = useNavigate();
  const [programId, setProgramId] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>();
  const [provinceList, setProvinceList] = useState<ProvinceProps[]>([]);
  const [regencyList, setRegencyList] = useState<RegencyProps[]>([]);
  const [profilePicture, setProfilePicture] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getProgramId = async () => {
    try {
      const res = await httpRequest.get('/program');
      console.log(res.data.payload[0].program_id);
      return res.data.payload[0].program_id;
    } catch (err: any) {
      console.error('Failed to get program id');
    }
  };

  const imageUploadProps: UploadProps = {
    multiple: false,
    customRequest: async ({ file, onSuccess }) => {
      try {
        setProfilePicture(file);
        onSuccess?.(file);
      } catch (error) {
        console.log('File upload failed', error);
      }
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
      formData.append('program_id', programId);
      const res = await axios.post('/custom/batch5', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setIsLoading(false);
      navigate('/login');
      message.success('Pendaftaran berhasil, silahkan cek email anda');
    } catch (err: any) {
      setIsLoading(false);
      message.error(
        err?.response?.data || 'Gagal mendaftar, silahkan hubungi admin'
      );
    }
  };

  useEffect(() => {
    getProgramId().then((res) => {
      setProgramId(res);
    });
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
  return (
    <Card className="card">
      <div
        style={{
          fontSize: 20,
          textAlign: 'center',
          marginBottom: 20
        }}
      >
        Pendaftaran TELISIK Angkatan 5
      </div>
      <Form layout="vertical" onFinish={handleSubmit}>
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
          <Select>
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

export default Batch5;
