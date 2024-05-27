import { Switch } from 'antd';

type PropTypes = {
  onChange: (isOptions: boolean) => void;
  defaultChecked: any;
};

const SwitchButton = (props: PropTypes) => {
  const { onChange, defaultChecked } = props;
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
