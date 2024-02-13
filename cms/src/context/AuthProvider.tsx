import React, { useState, useEffect } from "react";
import AuthContext from "./AuthContext";
import { AuthState, EAuthStatus } from "../types/auth.type";
import { initialUser } from "../types/user.type";
import { getToken } from "../helpers/auth";
import { message, Spin } from "antd";
import { getLoginData } from "../helpers/auth";

type Props = {
  children?: React.ReactNode;
};

const AuthProvider: React.FC<Props> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    status: EAuthStatus.LOGGED_OUT,
    user: initialUser,
    role: "",
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoaded(true);
      return;
    }

    getLoginData()
      .then((result) => {
        setAuth({
          status: EAuthStatus.LOGGED_IN,
          ...result,
        });
      })
      .catch((err) => message.error(err))
      .finally(() => setIsLoaded(true));

    // eslint-disable-next-line
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {isLoaded ? (
        children
      ) : (
        <Spin size="large">
          <div style={{ width: "100vw", height: "100vh" }} />
        </Spin>
      )}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
