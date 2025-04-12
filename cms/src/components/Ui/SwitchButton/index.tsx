import { Modal, Switch } from "antd";

type PropTypes = {
  onChange: (is_true: boolean) => void;
  defaultChecked: any;
};

const SwitchButton = (props: PropTypes) => {
  const { onChange, defaultChecked } = props;

  return (
    <div style={{ height: "25px" }}>
      <Switch
        checked={defaultChecked}
        onChange={(val) =>
          Modal.confirm({
            title: "Are you sure?",
            content: `Are you sure you want to change the status?`,
            onOk: () => onChange(val),
          })
        }
      />
    </div>
  );
};

export default SwitchButton;
