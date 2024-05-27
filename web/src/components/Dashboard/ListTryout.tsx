import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Modal, Form, Input, message } from 'antd';
import type { TableProps } from 'antd';
import useFetchList from '../../hooks/useFetchList';
import { TryoutProps } from '../../types/tryout.type';
import dayjs from 'dayjs';
import { redeemToken } from '../../api/tryout';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from 'react-auth-kit';

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
    endpoint: 'tryout'
  });

  const [id, setId] = useState('');
  const navigate = useNavigate();
  const auth = useAuthUser();

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (data: {
    tryout_id: string;
    user_id: string;
    token: string;
  }) => {
    try {
      const res = await redeemToken(data);
      if (res) {
        message.success('Validation success');
        navigate('/tryout/' + id + '/kpu/1');
      } else {
        message.error('Token Wrong');
      }
    } catch (err) {
      message.error('Token Wrong');
    }
  };

  const columns: TableProps<TryoutProps>['columns'] = [
    {
      title: 'Tryout',
      dataIndex: 'tryout',
      key: 'tryout',
      render: (_, record) => (
        <Link
          underline
          onClick={() => {
            const tryoutStatus = checkStatus(
              record.start_time,
              record.end_time
            );
            if (tryoutStatus === 'FINISHED') {
              message.error('Waktu tryout sudah lewat!');
            } else if (
              tryoutStatus === 'IN COMING' ||
              tryoutStatus === 'UNKNOWN'
            ) {
              message.error('Tryout belum mulai!');
            } else {
              setId(record.tryout_id);
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
    }
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Input Token');
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
    <div>
      <Table columns={columns} dataSource={tryoutData} />

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={() => {
          setId('');
          setIsModalOpen(false);
        }}
        onOk={form.submit}
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
          <Form.Item name="user_id" initialValue={auth()?.user_id} hidden />
          <Form.Item<FieldType>
            label="Token"
            name="token"
            rules={[{ required: true, message: 'Please input your token!' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListTryout;
