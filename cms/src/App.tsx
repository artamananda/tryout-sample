import RootNavigator from "./navigation/RootNavigator";
import { AuthProvider } from "react-auth-kit";
import { App as AntApp, ConfigProvider as AntConfigProvider } from "antd";
import idID from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import ConfigProvider from "./context/ConfigProvider";
import { appTheme } from "./theme/theme";
import "./theme/global.css";

dayjs.locale("id");

function App() {
  return (
    <AntConfigProvider theme={appTheme} locale={idID}>
      <AntApp>
        <ConfigProvider>
          <AuthProvider authType="localstorage" authName={"_auth"}>
            <RootNavigator />
          </AuthProvider>
        </ConfigProvider>
      </AntApp>
    </AntConfigProvider>
  );
}

export default App;
