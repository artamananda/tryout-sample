import { httpRequest } from '../helpers/api';
import { FetchMyTryoutResultResponse } from '../types/tryoutResult';

export const getMyTryoutResult = async (tryoutId: string) => {
  try {
    const res = await httpRequest.get<FetchMyTryoutResultResponse>(
      `${import.meta.env.VITE_BASE_URL}/tryout/${tryoutId}/results/me`
    );

    return res;
  } catch (err) {
    return null;
  }
};
