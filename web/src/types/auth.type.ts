import { BaseResponseProps } from "./config.type";
import { UserProperties, EUserRole } from "./user.type";

export enum EAuthStatus {
  LOGGED_OUT = "LOGGED_OUT",
  LOGGED_IN = "LOGGED_IN",
}

export interface ILoginData {
  email: string;
  password: string;
}

export type AuthState = {
  status: EAuthStatus;
  user: UserProperties;
  role: EUserRole;
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
