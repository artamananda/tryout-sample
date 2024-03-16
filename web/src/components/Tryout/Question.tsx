import parse from 'html-react-parser';
import { Image } from 'antd';
import katex from 'katex';
import 'katex/dist/katex.min.css';
window.katex = katex;

const Question = (props: { text?: string; imageUrl?: string }) => {
  return (
    <div>
      {props.imageUrl && <Image src={props.imageUrl} width={500} />}
      <div>{parse(props.text || '<div>loading...</div>')}</div>
    </div>
  );
};

export default Question;
