import { Switch } from 'antd';

type PropTypes = {
  onChange: (is_true: boolean) => void;
  defaultChecked: any;
};

const SwitchButton = (props: PropTypes) => {
  const { onChange, defaultChecked } = props;

  console.log(defaultChecked);

  return (
    <div style={{ height: '25px' }}>
      <Switch
        defaultChecked={defaultChecked}
        onChange={onChange}
      />
    </div>
  );
};

export default SwitchButton;
