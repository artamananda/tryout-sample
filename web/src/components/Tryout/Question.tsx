import parse from 'html-react-parser';
import katex from 'katex';
import 'katex/dist/katex.min.css';
window.katex = katex;

const Question = (props: { text?: string }) => {
  return <div>{parse(props.text || '<div>loading...</div>')}</div>;
};

export default Question;
