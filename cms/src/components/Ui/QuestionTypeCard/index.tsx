type PropTypes = {
  title: string;
  shortTitle?: string;
  backgroundColor: string;
  color: string;
  onClick: () => void;
  icon?: JSX.Element;
};

const QuestionTypeCard = (props: PropTypes) => {
  const { title, backgroundColor, color, onClick, shortTitle, icon } = props;
  return (
    <div
      style={{ boxShadow: '2px 2px 5px grey', paddingInline: '30px', borderRadius: '5px', backgroundColor: `${backgroundColor}`, gap: '0', cursor: 'pointer' }}
      onClick={onClick}
    >
      {shortTitle && <h1 style={{ fontSize: '40px', color: `${color}`, marginBottom: '0' }}>{shortTitle}</h1>}
      {icon && <h1 style={{ fontSize: '40px', color: `${color}`, marginBottom: '0' }}>{icon}</h1>}
      <h4 style={{ fontSize: '16px', marginBlock: '0', width: '65%' }}>{title}</h4>
      <div style={{ width: '70%', backgroundColor: `${color}`, height: '5px', marginTop: '4px', marginBottom: '35px' }} />
    </div>
  );
};

export default QuestionTypeCard;
