import { Radio, RadioChangeEvent, Space, Input } from 'antd';
import { useState } from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const Option = (props: {
  options: string[];
  setAnswer: (value: string) => void;
}) => {
  const options = props.options || ['A', 'B', 'C', 'D', 'E'];
  const [value, setValue] = useState(options[0]);

  const onChange = (e: RadioChangeEvent) => {
    props.setAnswer(e.target.value);
    setValue(e.target.value);
  };

  const isOption = () => {
    for (let i = 0; i < options.length; i++) {
      if (options[i]) {
        return true;
      }
    }
    return false;
  };

  return (
    <div>
      {!isOption() ? (
        <Input
          onChange={(e) => {
            props.setAnswer(e.target.value);
            setValue(e.target.value);
          }}
        />
      ) : (
        <Radio.Group onChange={onChange} value={value}>
          <Space direction="vertical">
            <Radio value={options[0]}>
              <Text style={{ fontSize: 16 }}>{options[0]}</Text>
            </Radio>
            <Radio value={options[1]}>
              <Text style={{ fontSize: 16 }}>{options[1]}</Text>
            </Radio>
            <Radio value={options[2]}>
              <Text style={{ fontSize: 16 }}>{options[2]}</Text>
            </Radio>
            <Radio value={options[3]}>
              <Text style={{ fontSize: 16 }}>{options[3]}</Text>
            </Radio>
            <Radio value={options[4]}>
              <Text style={{ fontSize: 16 }}>{options[4]}</Text>
            </Radio>
          </Space>
        </Radio.Group>
      )}
    </div>
  );
};

export default Option;
