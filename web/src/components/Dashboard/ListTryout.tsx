import React from 'react';
import { Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';

const { Text } = Typography;

interface DataType {
  key: string;
  tryout: string;
  startTime: Date;
  endTime: Date;
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: 'Tryout',
    dataIndex: 'tryout',
    key: 'tryout'
  },
  {
    title: 'Start Time',
    dataIndex: 'startTime',
    key: 'startTime',
    render: (_, { startTime }) => (
      <Text>{formatDateToCustomString(startTime)}</Text>
    )
  },
  {
    title: 'End Time',
    dataIndex: 'endTime',
    key: 'endTime',
    render: (_, { endTime }) => <Text>{formatDateToCustomString(endTime)}</Text>
  },
  {
    title: 'Status',
    key: 'status',
    dataIndex: 'status',
    render: (_, { startTime, endTime }) => (
      <Tag color={statusColor(checkStatus(startTime, endTime))}>
        {checkStatus(startTime, endTime)}
      </Tag>
    )
  }
];

function formatDateToCustomString(date: any) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  };

  const formattedDate = date
    .toLocaleDateString('id-ID', options)
    .replace(/,/g, '');

  return formattedDate;
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

const checkStatus = (startTime: Date, endTime: Date) => {
  if (startTime < new Date() && endTime > new Date()) {
    return 'ON GOING';
  } else if (startTime > new Date()) {
    return 'IN COMING';
  } else if (endTime < new Date()) {
    return 'FINISHED';
  } else {
    return 'UNKNOWN';
  }
};

const data: DataType[] = [
  {
    key: '1',
    tryout: 'Tryout December',
    startTime: new Date('2023-12-21T12:00:00'),
    endTime: new Date('2023-12-31T14:00:00')
  },
  {
    key: '2',
    tryout: 'Tryout January',
    startTime: new Date('2024-01-21T12:00:00'),
    endTime: new Date('2024-01-31T20:00:00')
  },
  {
    key: '3',
    tryout: 'Tryout February',
    startTime: new Date('2024-02-21T12:00:00'),
    endTime: new Date('2024-02-21T14:00:00')
  }
];

const ListTryout = () => {
  return <Table columns={columns} dataSource={data} />;
};

export default ListTryout;
