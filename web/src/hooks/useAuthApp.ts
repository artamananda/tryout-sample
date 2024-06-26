import { BaseResponseProps } from '../types/config.type';
import { message } from 'antd';
import { useState } from 'react';
import { httpRequest } from '../helpers/api';
import { saveToken } from '../helpers/auth';
import { useSignIn } from 'react-auth-kit';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type Props = {
  apiLoginUrl?: string;
  apiGetMyProfileUrl?: string;
};

export default function useAuthApp(props?: Props) {
  const navigate = useNavigate();
  const signIn = useSignIn();

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const doLogin = async (
    data: { email: string; password: string },
    callback?: () => void
  ) => {
    setIsAuthLoading(true);
    try {
      const resultAuthLogin = await httpRequest.post<
        BaseResponseProps<{
          token: string;
          username: string;
          user_id: string;
          role: string;
        }>
      >(props?.apiLoginUrl || process.env.REACT_APP_BASE_URL + '/login', data);

      if (!resultAuthLogin) {
        //
        message.error('Login failed. Empty response.');
        return;
      }

      if (resultAuthLogin) {
        saveToken(resultAuthLogin.data.payload.token);
      }

      const resProfile = await axios.get<
        BaseResponseProps<{
          token: string;
        }>
      >(
        props?.apiGetMyProfileUrl ||
          process.env.REACT_APP_BASE_URL +
            '/user/' +
            resultAuthLogin.data.payload.user_id,
        {
          headers: {
            Authorization: 'Bearer ' + resultAuthLogin.data.payload.token,
            username: resultAuthLogin.data.payload.username,
            role: resultAuthLogin.data.payload.role
          }
        }
      );

      if (!resProfile) {
        message.error('Login failed. No profile.');
        return;
      }

      if (
        signIn({
          token: resultAuthLogin.data.payload.token,
          expiresIn: 350,
          tokenType: 'Bearer',
          authState: resProfile.data.payload
        })
      ) {
        // Redirect or do-something
        // console.log(resProfile)
        if (callback) {
          callback();
        } else {
          navigate('/dashboard', { replace: true });
        }
        message.success('Welcome to ' + process.env.REACT_APP_WEBSITE_NAME);
      } else {
        message.error('Login failed.');
        //Throw error
      }
    } catch (err) {
      message.error('Login failed. ' + err);
    }

    setIsAuthLoading(false);
  };

  const doSendOtpEmail = async (data: { email: string }) => {
    try {
      setIsAuthLoading(true);
      const result = await httpRequest.post<
        BaseResponseProps<{
          email: string;
        }>
      >(process.env.REACT_APP_BASE_URL + '/email/send-otp', data);
    } catch (err) {
      message.error('Email/Username is already in use by another user.');
      setIsAuthLoading(false);
      return 1;
    }
    setIsAuthLoading(false);
  };

  const doRegister = async (
    data: {
      username: string;
      name: string;
      email: string;
      password: string;
      otp: string;
    },
    callback?: () => void
  ) => {
    setIsAuthLoading(true);
    try {
      const result = await httpRequest.post<
        BaseResponseProps<{
          email: string;
        }>
      >(process.env.REACT_APP_BASE_URL + '/register', data);

      if (!result) {
        message.error('Register failed. Empty response.');
        return;
      }

      if (result) {
        if (callback) {
          callback();
        } else {
          navigate('/login', { replace: true });
        }
        message.success('Your account has been registered successfully.');
      }
    } catch (err) {
      message.error('Send Otp Failed. ' + err);
    }
    setIsAuthLoading(false);
  };

  return {
    isAuthLoading,
    doLogin,
    doSendOtpEmail,
    doRegister
  };
}
