import React from "react";
import RootNavigator from "./navigation/RootNavigator";
import { AuthProvider } from "react-auth-kit";
import ConfigProvider from "./context/ConfigProvider";

function App() {
  return (
    <ConfigProvider>
      <AuthProvider authType="localstorage" authName={"_auth"}>
        <RootNavigator />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
