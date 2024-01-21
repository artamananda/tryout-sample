import { Radio, RadioChangeEvent, Space } from 'antd';
import { useState } from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const Option = () => {
  const options = ['A', 'B', 'C', 'D', 'E'];
  const [value, setValue] = useState(options[0]);

  const onChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
  };

  return (
    <Radio.Group onChange={onChange} value={value}>
      <Space direction="vertical">
        <Radio value={options[0]}>
          <Text style={{ fontSize: 16 }}>A</Text>
        </Radio>
        <Radio value={options[1]}>
          <Text style={{ fontSize: 16 }}>B</Text>
        </Radio>
        <Radio value={options[2]}>
          <Text style={{ fontSize: 16 }}>C</Text>
        </Radio>
        <Radio value={options[3]}>
          <Text style={{ fontSize: 16 }}>D</Text>
        </Radio>
        <Radio value={options[4]}>
          <Text style={{ fontSize: 16 }}>E</Text>
        </Radio>
      </Space>
    </Radio.Group>
  );
};

export default Option;
