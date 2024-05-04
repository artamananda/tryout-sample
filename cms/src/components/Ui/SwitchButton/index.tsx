import React, { useEffect } from 'react';
import { Switch } from 'antd';

type PropTypes = {
  setOptions: any;
  setOptionShow: any;
  options: string[];
};

const SwitchButton = (props: PropTypes) => {
  const { setOptionShow, setOptions, options } = props;
  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
    if (checked) {
      setOptions([''] as string[]);
      setOptionShow(false);
    } else {
      setOptionShow(true);
    }
  };

  useEffect(() => {
    onChange(options.every((option) => option !== '') ? false : true);
  }, []);
  return (
    <Switch
      defaultChecked={options.every((option) => option !== '') ? false : true}
      onChange={onChange}
    />
  );
};

export default SwitchButton;
