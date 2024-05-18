import React, { useEffect, useState } from 'react';
import { Switch } from 'antd';

type PropTypes = {
  setOptions: any;
  isOptions: any;
  setIsOptions: any;
  options: any;
};

const SwitchButton = (props: PropTypes) => {
  const { setOptions, isOptions, setIsOptions, options } = props;
  const [activedMode, setActivedMode] = useState<boolean>(false);
  const onChange = (isOptions: boolean) => {
    console.log(`switch to ${isOptions}`);
    console.log(`optionsnya${options}`);
    if (!isOptions) {
      setOptions([''] as string[]);
      setIsOptions(false);
    } else {
      setIsOptions(true);
      setOptions(options);
      setActivedMode(true);
    }
  };

  useEffect(() => {
    onChange(isOptions);
  }, [isOptions]);
  return (
    <div style={{ height: '25px' }}>
      <Switch
        defaultChecked={isOptions}
        onChange={onChange}
      />
      {isOptions == null && activedMode ? (
        <div style={{ position: 'absolute', bottom: '10', right: '0' }}>
          <p style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: '700' }}>
            Mode is <span style={{ color: 'blue' }}>active.</span> You can change to be <span style={{ color: 'blue' }}>Options</span> or <span style={{ color: 'blue' }}>Essay</span> mode.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default SwitchButton;
