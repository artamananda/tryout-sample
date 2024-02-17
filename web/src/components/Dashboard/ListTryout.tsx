import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Modal, Form, Input } from 'antd';
import type { TableProps } from 'antd';
import useFetchList from '../../hooks/useFetchList';
import { TryoutProps } from '../../types/tryout.type';
import dayjs from 'dayjs';

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

  useEffect(() => {
    fetchList();
  }, []);

  const columns: TableProps<TryoutProps>['columns'] = [
    {
      title: 'Tryout',
      dataIndex: 'tryout',
      key: 'tryout',
      render: (_, record) => (
        <Link underline onClick={() => showModal(record.title)}>
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

  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <Table columns={columns} dataSource={tryoutData} />

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
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
