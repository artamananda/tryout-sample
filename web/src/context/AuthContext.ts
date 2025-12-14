import React from 'react';
import { AuthState } from '../types/auth.type';
import { initialUser } from '../types/user.type';

type IContext = {
  auth: AuthState;
  setAuth: (value: any) => void;
};

const authContext = React.createContext<IContext>({
  auth: {
    user: initialUser,
    role: ''
  },
  setAuth: () => {}
});

export default authContext;
