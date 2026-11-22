import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  message,
  Row,
  Select,
  Spin,
  Tabs,
  Tag,
  Typography,
  Upload
} from 'antd';
import type { UploadProps } from 'antd';
import { CameraOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
  uploadMyPicture
} from '../../api/profile';
import { getErrorMessage } from '../../helpers/errorMessage';
import useIndonesiaRegions from '../../hooks/useIndonesiaRegions';
import useUpdateAuthUser from '../../hooks/useUpdateAuthUser';
import {
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  RoleList,
  UpdateMyProfileRequest,
  UserProperties
} from '../../types/user.type';
import './Profile.css';

const { Title, Text } = Typography;

const MAX_PICTURE_SIZE = 2 * 1024 * 1024;
const PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PROFILE_FIELDS: (keyof UpdateMyProfileRequest)[] = [
  'username',
  'name',
  'phone_number',
  'gender',
  'birth_date',
  'last_education',
  'major',
  'school',
  'province',
  'regency',
  'target_agency',
  'target_position',
  'nisn',
  'grade'
];

/** Shows a stored 62xxx number the way people type it (08xxx). */
const toLocalPhone = (phone?: string) =>
  phone && phone.startsWith('62') ? '0' + phone.slice(2) : phone || '';

const today = () => new Date().toISOString().slice(0, 10);

const ProfileScreen = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profile, setProfile] = useState<UserProperties>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const updateAuthUser = useUpdateAuthUser();

  const selectedProvince = Form.useWatch('province', profileForm);
  const { provinces, regencies } = useIndonesiaRegions(selectedProvince);

  const applyProfile = (user: UserProperties) => {
    setProfile(user);
    updateAuthUser(user);
    profileForm.setFieldsValue({
      ...user,
      email: user.email,
      phone_number: toLocalPhone(user.phone_number),
      gender: user.gender || undefined,
      last_education: user.last_education || undefined,
      province: user.province || undefined,
      regency: user.regency || undefined
    });
  };

  useEffect(() => {
    getMyProfile()
      .then(applyProfile)
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (values: Record<string, any>) => {
    // Send every editable field; a cleared input becomes '' so the API clears it.
    const payload: UpdateMyProfileRequest = {};
    PROFILE_FIELDS.forEach((field) => {
      const value = values[field];
      (payload as any)[field] =
        value === undefined || value === null ? '' : String(value).trim();
    });

    try {
      setIsSaving(true);
      applyProfile(await updateMyProfile(payload));
      message.success('Profil berhasil disimpan');
    } catch (err) {
      message.error(getErrorMessage(err, 'Gagal menyimpan profil'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (values: {
    old_password: string;
    new_password: string;
  }) => {
    try {
      setIsChangingPassword(true);
      await changeMyPassword({
        old_password: values.old_password,
        new_password: values.new_password
      });
      passwordForm.resetFields();
      message.success('Password berhasil diubah');
    } catch (err) {
      message.error(getErrorMessage(err, 'Gagal mengubah password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const pictureUploadProps: UploadProps = {
    accept: PICTURE_TYPES.join(','),
    showUploadList: false,
    beforeUpload: (file) => {
      if (!PICTURE_TYPES.includes(file.type)) {
        message.error('Format foto harus JPG, PNG, atau WEBP');
        return Upload.LIST_IGNORE;
      }
      if (file.size > MAX_PICTURE_SIZE) {
        message.error('Ukuran foto maksimal 2 MB');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setIsUploading(true);
        applyProfile(await uploadMyPicture(file as File));
        message.success('Foto profil diperbarui');
        onSuccess?.({});
      } catch (err) {
        message.error(getErrorMessage(err, 'Gagal mengunggah foto'));
        onError?.(err as Error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert
        type="error"
        showIcon
        message="Profil tidak dapat dimuat"
        description="Muat ulang halaman, atau keluar lalu masuk kembali."
      />
    );
  }

  const isProfileIncomplete = !profile.phone_number || !profile.last_education;

  const profileTab = (
    <Form
      form={profileForm}
      layout="vertical"
      onFinish={handleSaveProfile}
      requiredMark="optional"
    >
      {isProfileIncomplete && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="Lengkapi profil Anda"
          description="Nomor WhatsApp dan pendidikan terakhir dipakai untuk mengirim hasil tryout dan informasi program."
        />
      )}

      <Title level={5} className="profile-section-title">
        Akun
      </Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="email"
            label="Email"
            extra="Email tidak dapat diubah. Hubungi admin bila perlu menggantinya."
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Username wajib diisi' },
              { min: 3, message: 'Username minimal 3 karakter' },
              { max: 50, message: 'Username maksimal 50 karakter' },
              {
                pattern: /^[a-zA-Z0-9_.]+$/,
                message: 'Hanya huruf, angka, titik, dan garis bawah'
              }
            ]}
          >
            <Input autoComplete="username" />
          </Form.Item>
        </Col>
      </Row>

      <Divider />
      <Title level={5} className="profile-section-title">
        Data Diri
      </Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="name"
            label="Nama Lengkap"
            rules={[
              { required: true, whitespace: true, message: 'Nama wajib diisi' },
              { max: 100, message: 'Nama maksimal 100 karakter' }
            ]}
          >
            <Input autoComplete="name" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="phone_number"
            label="Nomor WhatsApp"
            extra="Contoh: 081234567890. Satu nomor hanya untuk satu akun."
            rules={[
              {
                pattern: /^(\+?62|0)?\s?8[0-9\s-]{7,15}$/,
                message: 'Masukkan nomor WhatsApp Indonesia yang valid'
              }
            ]}
          >
            <Input inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="gender" label="Jenis Kelamin">
            <Select allowClear placeholder="Pilih jenis kelamin" options={GENDER_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="birth_date" label="Tanggal Lahir">
            <Input type="date" max={today()} />
          </Form.Item>
        </Col>
      </Row>

      <Divider />
      <Title level={5} className="profile-section-title">
        Pendidikan
      </Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="last_education" label="Pendidikan Terakhir">
            <Select
              allowClear
              placeholder="Pilih jenjang"
              options={EDUCATION_OPTIONS.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="major"
            label="Jurusan / Program Studi"
            rules={[{ max: 150, message: 'Maksimal 150 karakter' }]}
          >
            <Input placeholder="Contoh: Akuntansi" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name="school"
            label="Asal Sekolah / Kampus"
            rules={[{ max: 255, message: 'Maksimal 255 karakter' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider />
      <Title level={5} className="profile-section-title">
        Domisili
      </Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="province" label="Provinsi">
            <Select
              allowClear
              showSearch
              placeholder="Pilih provinsi"
              optionFilterProp="label"
              options={provinces.map((item) => ({ value: item.name, label: item.name }))}
              onChange={() => profileForm.setFieldValue('regency', undefined)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="regency" label="Kabupaten / Kota">
            <Select
              allowClear
              showSearch
              placeholder={selectedProvince ? 'Pilih kabupaten/kota' : 'Pilih provinsi dulu'}
              disabled={!selectedProvince}
              optionFilterProp="label"
              options={regencies.map((item) => ({ value: item.name, label: item.name }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />
      <Title level={5} className="profile-section-title">
        Target CPNS
      </Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="target_agency"
            label="Instansi Tujuan"
            rules={[{ max: 150, message: 'Maksimal 150 karakter' }]}
          >
            <Input placeholder="Contoh: Kementerian Keuangan" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="target_position"
            label="Formasi / Jabatan Tujuan"
            rules={[{ max: 150, message: 'Maksimal 150 karakter' }]}
          >
            <Input placeholder="Contoh: Analis Keuangan" />
          </Form.Item>
        </Col>
      </Row>

      <Collapse
        ghost
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'student',
            label: 'Data Siswa (khusus peserta UTBK)',
            forceRender: true,
            children: (
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="nisn"
                    label="NISN"
                    rules={[
                      { len: 10, message: 'NISN harus 10 digit' },
                      { pattern: /^\d+$/, message: 'NISN hanya boleh angka' }
                    ]}
                  >
                    <Input maxLength={10} inputMode="numeric" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="grade" label="Kelas">
                    <Select
                      allowClear
                      placeholder="Pilih kelas"
                      options={['10', '11', '12', 'Gap Year'].map((value) => ({
                        value,
                        label: value
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )
          }
        ]}
      />

      <div className="profile-actions">
        <Button type="primary" htmlType="submit" loading={isSaving}>
          Simpan Profil
        </Button>
      </div>
    </Form>
  );

  const securityTab = (
    <Form
      form={passwordForm}
      layout="vertical"
      onFinish={handleChangePassword}
      style={{ maxWidth: 420 }}
    >
      <Form.Item
        name="old_password"
        label="Password Lama"
        rules={[{ required: true, message: 'Password lama wajib diisi' }]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Form.Item
        name="new_password"
        label="Password Baru"
        rules={[
          { required: true, message: 'Password baru wajib diisi' },
          { min: 6, message: 'Password minimal 6 karakter' },
          { max: 72, message: 'Password maksimal 72 karakter' }
        ]}
        hasFeedback
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirm_password"
        label="Ulangi Password Baru"
        dependencies={['new_password']}
        hasFeedback
        rules={[
          { required: true, message: 'Ulangi password baru' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('new_password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Password tidak sama'));
            }
          })
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Lupa password lama? Keluar lalu gunakan menu "Lupa Password" di halaman
        masuk.
      </Text>
      <Button type="primary" htmlType="submit" loading={isChangingPassword}>
        Ubah Password
      </Button>
    </Form>
  );

  return (
    <div className="profile-page">
      <Card>
        <div className="profile-header">
          <Avatar
            size={88}
            src={profile.picture_url || undefined}
            icon={<UserOutlined />}
          />
          <div className="profile-header-info">
            <h2>{profile.name}</h2>
            <div className="profile-header-email">{profile.email}</div>
            <div style={{ marginTop: 6 }}>
              <Tag color="blue">{RoleList[profile.role] || profile.role}</Tag>
              <Text type="secondary">@{profile.username}</Text>
            </div>
          </div>
          <Upload {...pictureUploadProps}>
            <Button icon={<CameraOutlined />} loading={isUploading}>
              Ganti Foto
            </Button>
          </Upload>
        </div>
      </Card>

      <Card>
        <Tabs
          items={[
            {
              key: 'profile',
              label: (
                <span>
                  <UserOutlined /> Data Profil
                </span>
              ),
              children: profileTab
            },
            {
              key: 'security',
              label: (
                <span>
                  <LockOutlined /> Keamanan
                </span>
              ),
              children: securityTab
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default ProfileScreen;
