import { httpRequest } from '../helpers/api';
import { getErrorMessage } from '../helpers/errorMessage';
import { BaseResponseProps } from '../types/config.type';
import { TransactionTryoutProps } from '../types/transactionTryout';

/** Starts a tryout with its token. Returns the reason when it cannot start. */
export const redeemToken = async (data: {
  tryout_id: string;
  token: string;
}): Promise<{ ok: boolean; message?: string }> => {
  try {
    await httpRequest.post<BaseResponseProps<TransactionTryoutProps>>(
      import.meta.env.VITE_BASE_URL + '/transaction-tryout',
      { tryout_id: data.tryout_id }
    );
    const res = await httpRequest.patch<
      BaseResponseProps<TransactionTryoutProps>
    >(import.meta.env.VITE_BASE_URL + '/transaction-tryout/paid', data);
    if (res.data.payload?.transaction_tryout_id) {
      return { ok: true };
    }
    return { ok: false, message: 'Token salah' };
  } catch (err: any) {
    const payload = err?.data?.payload;
    if (payload === 'Invalid Token') {
      return { ok: false, message: 'Token salah' };
    }
    return { ok: false, message: getErrorMessage(err, 'Tryout tidak dapat dimulai') };
  }
};

export const finishTryout = async (data: {
  tryout_id: string;
  user_id: string;
}) => {
  try {
    const res = await httpRequest.patch<
      BaseResponseProps<TransactionTryoutProps>
    >(import.meta.env.VITE_BASE_URL + '/transaction-tryout/complete', data);
    if (res.data.payload?.transaction_tryout_id) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};
