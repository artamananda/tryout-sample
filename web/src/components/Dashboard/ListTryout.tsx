import React, { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Alert,
  Button,
  Space,
  Tooltip,
  Card
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import useFetchList from '../../hooks/useFetchList';
import { TryoutProps } from '../../types/tryout.type';
import dayjs from 'dayjs';
import { redeemToken } from '../../api/tryout';
import { useNavigate } from 'react-router-dom';

const { Text, Link } = Typography;

// interface DataType {
//   key: string;
//   tryout: string;
//   startTime: Date;
//   endTime: Date;
// }

type FieldType = {
  token?: string;
};

// const data: DataType[] = [
//   {
//     key: '1',
//     tryout: 'Tryout December',
//     startTime: new Date('2023-12-21T12:00:00'),
//     endTime: new Date('2023-12-31T14:00:00')
//   },
//   {
//     key: '2',
//     tryout: 'Tryout January',
//     startTime: new Date('2024-01-21T12:00:00'),
//     endTime: new Date('2024-01-31T20:00:00')
//   },
//   {
//     key: '3',
//     tryout: 'Tryout February',
//     startTime: new Date('2024-02-21T12:00:00'),
//     endTime: new Date('2024-02-21T14:00:00')
//   }
// ];

const ListTryout = () => {
  const { data: tryoutData, fetchList } = useFetchList<TryoutProps>({
    endpoint: 'tryout',
    initialQuery: {
      is_published: 'true'
    }
  });

  const [id, setId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (data: { tryout_id: string; token: string }) => {
    const res = await redeemToken({ tryout_id: data.tryout_id, token: data.token });
    if (res.ok) {
      navigate('/tryout/' + id + '/kpu/1');
    } else {
      message.error(res.message || 'Token salah');
    }
  };

  const showLocked = (record: TryoutProps) => {
    Modal.info({
      title: 'Tryout terkunci',
      content: record.locked_reason || 'Tryout ini belum termasuk dalam paket Anda.',
      okText: 'Lihat Paket',
      onOk: () =>
        navigate(record.program_id ? `/program/${record.program_id}/paket` : '/paket')
    });
  };

  const isSKD = (record: TryoutProps) => record.scoring_mode === 'skd';

  const columns: TableProps<TryoutProps>['columns'] = [
    {
      title: 'Tryout',
      dataIndex: 'tryout',
      key: 'tryout',
      render: (_, record) => (
        <Link
          underline
          onClick={() => {
            if (record.has_access === false) {
              showLocked(record);
              return;
            }
            const tryoutStatus = checkStatus(
              record.start_time,
              record.end_time
            );
            if (tryoutStatus === 'FINISHED') {
              if (isSKD(record)) {
                navigate('/tryout/' + record.tryout_id + '/hasil-skd');
              } else if (record.show_score) {
                navigate('/tryout/' + record.tryout_id + '/my-score');
              } else {
                message.error('Hasil tryout belum dipublikasikan.');
              }
            } else if (
              tryoutStatus === 'IN COMING' ||
              tryoutStatus === 'UNKNOWN'
            ) {
              message.error('Tryout belum mulai!');
            } else {
              setId(record.tryout_id);
              // The API sends the token only while the tryout is open for this
              // participant; otherwise they type the one shared by the admin.
              setAutoToken(Boolean(record.token));
              form.setFieldValue('tryout_id', record.tryout_id);
              form.setFieldValue('token', record.token || '');
              showModal(record.title);
            }
          }}
        >
          {record.title}
        </Link>
      )
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (_, { start_time }) => (
        <Text>{formatDateToCustomString(start_time)}</Text>
      )
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (_, { end_time }) => (
        <Text>{formatDateToCustomString(end_time)}</Text>
      )
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (_, { start_time, end_time }) => (
        <Tag color={statusColor(checkStatus(start_time, end_time))}>
          {checkStatus(start_time, end_time)}
        </Tag>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) =>
        record.has_access === false ? (
          <Tooltip title={record.locked_reason}>
            <Button size="small" icon={<LockOutlined />} onClick={() => showLocked(record)}>
              Buka dengan Paket
            </Button>
          </Tooltip>
        ) : isSKD(record) ? (
          <Space>
            <Button size="small" onClick={() => navigate('/tryout/' + record.tryout_id + '/hasil-skd')}>
              Hasil & Peringkat
            </Button>
          </Space>
        ) : null
    }
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Input Token');
  const [autoToken, setAutoToken] = useState(false);
  const [form] = Form.useForm();

  const showModal = (modalTitle: string) => {
    setModalTitle(modalTitle);
    setIsModalOpen(true);
  };

  function formatDateToCustomString(date: any) {
    return dayjs(date).locale('id').format('DD MMMM YYYY HH:mm');
  }

  const statusColor = (status: string) => {
    if (status === 'ON GOING') {
      return 'green';
    } else if (status === 'IN COMING') {
      return 'blue';
    } else {
      return 'red';
    }
  };

  const checkStatus = (startTime: Date | string, endTime: Date | string) => {
    if (new Date(startTime) < new Date() && new Date(endTime) > new Date()) {
      return 'ON GOING';
    } else if (new Date(startTime) > new Date()) {
      return 'IN COMING';
    } else if (new Date(endTime) < new Date()) {
      return 'FINISHED';
    } else {
      return 'UNKNOWN';
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    message.error('Wrong Token');
  };

  return (
    <Card className="tl-card" bodyStyle={{ padding: 0 }}>
      <Table
        columns={columns}
        dataSource={tryoutData}
        rowKey="tryout_id"
        scroll={{ x: true }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={() => {
          form.setFieldValue('token', '');
          setIsModalOpen(false);
        }}
        onOk={form.submit}
        okText={autoToken ? 'Mulai Tryout' : 'OK'}
      >
        <Form
          form={form}
          name="basic"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item name="tryout_id" initialValue={id} hidden>
            <Input value={id} />
          </Form.Item>
          <Form.Item<FieldType>
            label="Token"
            name="token"
            hidden={autoToken}
            rules={[{ required: true, message: 'Masukkan token tryout!' }]}
          >
            <Input />
          </Form.Item>
          {autoToken && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message="Token sudah tersedia untuk Anda"
              description="Tryout ini termasuk dalam paket Anda dan sedang dibuka. Tekan Mulai Tryout untuk mulai mengerjakan."
            />
          )}
          <Alert
            type="warning"
            showIcon
            message="Petunjuk Tryout"
            description={
              <>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    listStyleType: 'decimal',
                    listStylePosition: 'outside'
                  }}
                >
                  <li>Tryout akan langsung dimulai setelah Anda menekan tombol mulai.</li>
                  <li>
                    Pastikan koneksi internet stabil sebelum menekan tombol
                    mulai.
                  </li>
                  <li>
                    Tryout ini hanya bisa dikerjakan satu kali dalam satu waktu.
                    Jika terjadi kendala atau otomatis logout, segera login
                    kembali lalu masuk ke tryout yang sama.
                  </li>
                  <li>
                    Waktu tetap berjalan dan tidak berhenti saat Anda keluar
                    dari halaman.
                  </li>
                  <li>
                    Pastikan Anda berada di tempat yang tenang dan bebas dari
                    gangguan selama tryout berlangsung.
                  </li>
                  <li>
                    Dilarang mencontek, membuka catatan, atau meminta bantuan
                    pihak lain selama tryout.
                  </li>
                  <li>
                    Dilarang berdiskusi, berbagi soal, atau membagikan jawaban
                    kepada peserta lain.
                  </li>
                  <li>
                    Jawablah dengan jujur agar skor mencerminkan kemampuan dan
                    proses belajar Anda yang sebenarnya.
                  </li>
                  <li>
                    Dengan melanjutkan, Anda dianggap memahami dan menyetujui
                    seluruh ketentuan di atas.
                  </li>
                </ol>
              </>
            }
          />
        </Form>
      </Modal>
    </Card>
  );
};

export default ListTryout;
