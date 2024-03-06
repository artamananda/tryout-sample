import { Typography } from "antd";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useNavigate } from "react-router-dom";
window.katex = katex;

const { Title } = Typography;

const CreateTryout = () => {
  const navigate = useNavigate();
  return (
    <div>
      <Title level={3}>Basic Config</Title>
      <Title style={{ fontWeight: "bold" }}>
        {"Tes Potensi Skolastik (TPS)"}
      </Title>
      <Title onClick={() => navigate("kpu")} level={3}>
        Kemampuan Penalaran Umum
      </Title>

      <Title onClick={() => navigate("ppu")} level={3}>
        Pengetahuan dan Pemahaman Umum
      </Title>
      <Title onClick={() => navigate("pbm")} level={3}>
        Kemampuan Memahami Bacaan dan Menulis
      </Title>
      <Title onClick={() => navigate("pku")} level={3}>
        Pengetahuan Kuantitatif
      </Title>

      <Title style={{ fontWeight: "bold" }}>Tes Literasi</Title>
      <Title onClick={() => navigate("ind")} level={3}>
        Literasi Bahasa Indonesia
      </Title>
      <Title onClick={() => navigate("ing")} level={3}>
        Literasi Bahasa Inggris
      </Title>
      <Title onClick={() => navigate("mtk")} level={3}>
        Penalaran Matematika
      </Title>
    </div>
  );
};

export default CreateTryout;
