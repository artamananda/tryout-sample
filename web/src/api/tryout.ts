import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';
import { TryoutProps } from '../types/tryout.type';

export const checkToken = async (data: {
  tryout_id: string;
  token: string;
}) => {
  try {
    const res = await httpRequest.get<BaseResponseProps<TryoutProps>>(
      process.env.REACT_APP_BASE_URL + '/tryout/' + data.tryout_id
    );
    if (res) {
      if (res.data.payload.token === data.token) {
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
};
