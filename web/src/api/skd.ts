import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';
import { SKDResultProps } from '../types/skd.type';

export const getMySKDResult = async (tryoutId: string) => {
  const res = await httpRequest.get<BaseResponseProps<SKDResultProps>>(
    `/tryout/${tryoutId}/skd-result/me`
  );
  return res.data.payload;
};
