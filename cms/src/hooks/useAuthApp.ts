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
          token: string;
          username: string;
          user_id: string;
          role: string;
        }>
      >(props?.apiLoginUrl || process.env.REACT_APP_BASE_URL + "/login", data);

      if (!resultAuthLogin) {
        //
        console.log(process.env.REACT_APP_BASE_URL + "/login");
        message.error("Login failed. Empty response.");
        return;
      }

      if (resultAuthLogin) {
        saveToken(resultAuthLogin.data.data.token);
      }

      console.log(resultAuthLogin);
      const resProfile = await axios.get<
        BaseResponseProps<{
          token: string;
        }>
      >(
        props?.apiGetMyProfileUrl ||
          process.env.REACT_APP_BASE_URL +
            "/user/" +
            resultAuthLogin.data.data.user_id,
        {
          headers: {
            Authorization: "Bearer " + resultAuthLogin.data.data.token,
            username: resultAuthLogin.data.data.username,
            role: resultAuthLogin.data.data.role,
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
          token: resultAuthLogin.data.data.token,
          expiresIn: 10000,
          tokenType: "Bearer",
          authState: resProfile.data.data,
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
