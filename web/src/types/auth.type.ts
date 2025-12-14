import { BaseResponseProps } from './config.type';
import { UserProperties } from './user.type';

export interface ILoginData {
  email: string;
  password: string;
}

export type AuthState = {
  user: UserProperties;
  role: string;
};

export interface SignInProps {
  email: string;
  password: string;
}

export interface ForgotPasswordProps {
  email: string;
}

export interface ResetPasswordProps {
  newPassword: string;
}

export interface SignInResponseProps
  extends BaseResponseProps<{
    token: string;
  }> {}

export interface ForgotPasswordResponseProps
  extends BaseResponseProps<{
    email: string;
    isSuccess: boolean;
  }> {}

export interface ResetPasswordResponseProps
  extends BaseResponseProps<{
    isSuccess: boolean;
  }> {}
