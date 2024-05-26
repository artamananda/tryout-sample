import React from 'react';
import './App.css';
import RootNavigator from './navigation/RootNavigator';
import { ConfigProvider } from 'antd';
import { AuthProvider } from 'react-auth-kit';
import { APP_AUTH_TOKEN } from './helpers/auth';

function App() {
  return (
    <ConfigProvider>
      <AuthProvider authType="localstorage" authName={APP_AUTH_TOKEN}>
        <RootNavigator />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
