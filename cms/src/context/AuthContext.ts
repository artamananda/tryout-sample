import React from "react";
import { AuthState, EAuthStatus } from "../types/auth.type";
import { initialUser } from "../types/user.type";

type IContext = {
  auth: AuthState;
  setAuth: (value: any) => void;
};

const authContext = React.createContext<IContext>({
  auth: {
    status: EAuthStatus.LOGGED_OUT,
    user: initialUser,
    role: "",
  },
  setAuth: () => {},
});

export default authContext;
