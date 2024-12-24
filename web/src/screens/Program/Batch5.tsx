import { Button, Card, Checkbox, Form, Input, Select, Typography } from 'antd';
import './style.css';
import { useEffect, useState } from 'react';

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
  const [selectedProvince, setSelectedProvince] = useState<string>();
  const [selectedRegency, setSelectedRegency] = useState<string>();
  const [provinceList, setProvinceList] = useState<ProvinceProps[]>([]);
  const [regencyList, setRegencyList] = useState<RegencyProps[]>([]);

  const handleSubmit = (values: any) => {
    console.log(JSON.stringify(values));
  };

  useEffect(() => {
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
          <Input required />
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
          <Select onSelect={(value) => setSelectedRegency(value)}>
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
          >
            Daftar
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Batch5;
