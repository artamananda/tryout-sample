type PropTypes = {
  title?: string;
  color?: string;
  backgroundColor?: string;
  onClick?: () => void;
  icon?: JSX.Element;
};

const ButtonUi = (props: PropTypes) => {
  const { title, color, onClick, icon, backgroundColor } = props;
  return (
    <button
      style={{ color: `${color}`, backgroundColor: `${backgroundColor}`, paddingInline: '13px', paddingBlock: '8px', borderRadius: '5px', border: '1px solid #d9d9d9', gap: '7px', display: 'flex', alignItems: 'center' }}
      onClick={onClick}
    >
      {title}
      {icon}
    </button>
  );
};

export default ButtonUi;
