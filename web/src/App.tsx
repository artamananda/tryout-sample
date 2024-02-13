import React from 'react';
import './App.css';
import RootNavigator from './navigation/RootNavigator';
import { ConfigProvider } from 'antd';
import { AuthProvider } from 'react-auth-kit';

function App() {
  return (
    <ConfigProvider>
      <AuthProvider authType="localstorage" authName={'_auth'}>
        <RootNavigator />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
