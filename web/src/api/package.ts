import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';
import { OrderProps, ProgramPackagesProps } from '../types/package.type';

export const getProgramPackages = async (programId: string) => {
  const res = await httpRequest.get<BaseResponseProps<ProgramPackagesProps>>(
    `/program/${programId}/packages`
  );
  return res.data.payload;
};

export const checkoutPackage = async (packageId: string, referralCode?: string) => {
  const res = await httpRequest.post<BaseResponseProps<OrderProps>>('/order', {
    package_id: packageId,
    referral_code: referralCode?.trim() || undefined
  });
  return res.data.payload;
};

export const getMyOrders = async () => {
  const res = await httpRequest.get<
    BaseResponseProps<{ count: number; results: OrderProps[] }>
  >('/order/me');
  return res.data.payload.results;
};

export const getOrder = async (orderNumber: string) => {
  const res = await httpRequest.get<BaseResponseProps<OrderProps>>(
    `/order/${encodeURIComponent(orderNumber)}`
  );
  return res.data.payload;
};
