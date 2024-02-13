import { BaseResponseProps } from "../types/config.type";
import { message } from "antd";
import { useState } from "react";
import { httpRequest } from "../helpers/api";
import { saveToken } from "../helpers/auth";
import { useSignIn } from "react-auth-kit";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
          access_token: string;
          refresh_token: string;
        }>
      >(
        props?.apiLoginUrl || process.env.REACT_APP_BASE_URL + "/auth/signin",
        data
      );

      if (!resultAuthLogin) {
        //
        message.error("Login failed. Empty response.");
        return;
      }

      if (resultAuthLogin) {
        saveToken(resultAuthLogin.data.payload.access_token);
      }

      console.log(resultAuthLogin);
      const resProfile = await axios.get<
        BaseResponseProps<{
          token: string;
        }>
      >(
        props?.apiGetMyProfileUrl ||
          process.env.REACT_APP_BASE_URL + "/users/me",
        {
          headers: {
            Authorization:
              "Bearer " + resultAuthLogin.data.payload.access_token,
          },
        }
      );
      console.log("resProfile", resProfile);

      if (!resProfile) {
        message.error("Login failed. No profile.");
        return;
      }

      if (
        signIn({
          token: resultAuthLogin.data.payload.access_token,
          expiresIn: 10000,
          tokenType: "Bearer",
          authState: resProfile.data.payload,
        })
      ) {
        // Redirect or do-something
        // console.log(resProfile)
        if (callback) {
          callback();
        } else {
          navigate("/dashboard", { replace: true });
        }
        message.success("Welcome to " + process.env.REACT_APP_WEBSITE_NAME);
      } else {
        message.error("Login failed.");
        //Throw error
      }
    } catch (err) {
      message.error("Login failed. " + err);
    }

    setIsAuthLoading(false);
  };

  return {
    isAuthLoading,
    doLogin,
  };
}
