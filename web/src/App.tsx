import RootNavigator from './navigation/RootNavigator';
import { App as AntApp, ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { AuthProvider } from 'react-auth-kit';
import { APP_AUTH_TOKEN } from './helpers/auth';
import { appTheme } from './theme/theme';
import './theme/global.css';

dayjs.locale('id');

function App() {
  return (
    <ConfigProvider theme={appTheme} locale={idID}>
      <AntApp>
        <AuthProvider authType="localstorage" authName={APP_AUTH_TOKEN}>
          <RootNavigator />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
