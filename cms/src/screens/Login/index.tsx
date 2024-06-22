import LoginForm from "../../components/Login/LoginForm";
import { Image } from "antd";
import logo from "../../assets/logo.png";
import FooterCopyright from "../../components/Footer";

const LoginScreen = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f0f0f0",
        border: "1px solid black",
      }}
    >
      <div style={{ marginBottom: "40px" }}>
        <Image width={250} src={logo} preview={false} />
      </div>
      <LoginForm />
      <div style={{ position: "absolute", bottom: 0, marginBlock: 20 }}>
        <FooterCopyright />
      </div>
    </div>
  );
};

export default LoginScreen;
