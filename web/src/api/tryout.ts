import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';
import { TransactionTryoutProps } from '../types/transactionTryout';

export const redeemToken = async (data: {
  tryout_id: string;
  user_id: string;
  token: string;
}) => {
  try {
    await httpRequest.post<BaseResponseProps<TransactionTryoutProps>>(
      process.env.REACT_APP_BASE_URL + '/transaction-tryout',
      data
    );
    const res = await httpRequest.patch<
      BaseResponseProps<TransactionTryoutProps>
    >(process.env.REACT_APP_BASE_URL + '/transaction-tryout/paid', data);
    if (res.data.payload?.transaction_tryout_id) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const finishTryout = async (data: {
  tryout_id: string;
  user_id: string;
}) => {
  try {
    const res = await httpRequest.patch<
      BaseResponseProps<TransactionTryoutProps>
    >(process.env.REACT_APP_BASE_URL + '/transaction-tryout/completed', data);
    if (res.data.payload?.transaction_tryout_id) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};
