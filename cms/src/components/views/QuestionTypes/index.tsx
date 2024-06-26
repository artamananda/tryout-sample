import { Typography } from 'antd';

const { Title } = Typography;

type PropTypes = {
  title: string;
  children: JSX.Element[];
};

const QuestionTypes = ({ title, children }: PropTypes) => {
  return (
    <div style={{ marginBlock: '30px' }}>
      <Title style={{ fontWeight: 'bold', fontSize: '25px', color: 'gray' }}>{title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', color: 'white', fontSize: '13px' }}>{children}</div>
    </div>
  );
};

export default QuestionTypes;
