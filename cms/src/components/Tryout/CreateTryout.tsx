import 'react-quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useNavigate } from 'react-router-dom';
import { GiBookCover } from 'react-icons/gi';
import { FaBookAtlas } from 'react-icons/fa6';
import { PiMathOperationsFill } from 'react-icons/pi';
import QuestionTypeCard from '../Ui/QuestionTypeCard';
import QuestionTypes from '../views/QuestionTypes';
window.katex = katex;

const CreateTryout = () => {
  const navigate = useNavigate();
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const parts = pathname.split('/');
  const tryoutId = parts[parts.length - 2];
  return (
    <>
      <QuestionTypes title="TES POTENSI SKOLASTIK (TPS)">
        <QuestionTypeCard
          title="KEMAMPUAN PENALARAN UMUM"
          shortTitle="KPU"
          onClick={() => navigate('/tryout/' + tryoutId + '/question' + '/kpu')}
          backgroundColor="#0061f2"
          color="#0049B5"
        />
        <QuestionTypeCard
          title="PENGETAHUAN PEMAHAMAN UMUM"
          shortTitle="PPU"
          onClick={() => navigate('/tryout/' + tryoutId + '/question' + '/ppu')}
          backgroundColor="#f4a100"
          color="#CE8A03"
        />
        <QuestionTypeCard
          title="MEMAHAMI BACAAN DAN MENULIS"
          shortTitle="PBM"
          onClick={() => navigate('/tryout/' + tryoutId + '/question' + '/pbm')}
          backgroundColor="#00ac69"
          color="#00945B"
        />
        <QuestionTypeCard
          title="PENGETAHUAN KUANTITATIF"
          shortTitle="PKU"
          onClick={() => navigate('/tryout/' + tryoutId + '/question' + '/pku')}
          backgroundColor="#e81500"
          color="#BE1000"
        />
      </QuestionTypes>
      <QuestionTypes title="TES LITERASI">
        <QuestionTypeCard
          title="LITERASI BAHASA INDONESIA"
          icon={<GiBookCover />}
          onClick={() => navigate('ind')}
          backgroundColor="#0061f2"
          color="#0049B5"
        />
        <QuestionTypeCard
          title="LITERASI BAHASA INGGRIS"
          icon={<FaBookAtlas />}
          onClick={() => navigate('ing')}
          backgroundColor="#f4a100"
          color="#CE8A03"
        />
        <QuestionTypeCard
          title="PENALARAN MATEMATIKA"
          icon={<PiMathOperationsFill />}
          onClick={() => navigate('mtk')}
          backgroundColor="#00ac69"
          color="#00945B"
        />
      </QuestionTypes>
    </>
  );
};

export default CreateTryout;
