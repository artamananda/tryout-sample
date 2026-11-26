import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';
import { SKDLeaderboardProps, SKDResultProps } from '../types/skd.type';

export const getMySKDResult = async (tryoutId: string) => {
  const res = await httpRequest.get<BaseResponseProps<SKDResultProps>>(
    `/tryout/${tryoutId}/skd-result/me`
  );
  return res.data.payload;
};

export const getSKDLeaderboard = async (
  tryoutId: string,
  params: { page?: number; limit?: number; province?: string } = {}
) => {
  const res = await httpRequest.get<BaseResponseProps<SKDLeaderboardProps>>(
    `/tryout/${tryoutId}/skd-leaderboard`,
    { params: { ...params, province: params.province || undefined } }
  );
  return res.data.payload;
};
