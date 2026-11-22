import { httpRequest } from "../helpers/api";
import { OrderProps, PackageProps } from "../types/package.type";

export const apiGetProgramPackages = async (programId: string) => {
  const res = await httpRequest.get(`/admin/program/${programId}/packages`);
  return (res.data?.payload?.results || []) as PackageProps[];
};

export const apiCreatePackage = async (data: Record<string, unknown>) => {
  const res = await httpRequest.post("/package", data);
  return res.data?.payload as PackageProps;
};

export const apiUpdatePackage = async (packageId: string, data: Record<string, unknown>) => {
  const res = await httpRequest.patch(`/package/${packageId}`, data);
  return res.data?.payload as PackageProps;
};

export const apiDeletePackage = async (packageId: string) => {
  await httpRequest.delete(`/package/${packageId}`);
};

export const apiGetOrders = async (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.append(key, String(value));
  });
  const res = await httpRequest.get(`/order?${query.toString()}`);
  return {
    count: (res.data?.payload?.count || 0) as number,
    results: (res.data?.payload?.results || []) as OrderProps[],
  };
};

export const apiMarkOrderPaid = async (orderId: string, data: { payment_method?: string; reference?: string }) => {
  const res = await httpRequest.patch(`/order/${orderId}/mark-paid`, data);
  return res.data?.payload as OrderProps;
};

export const apiGetSKDRanking = async (tryoutId: string) => {
  const res = await httpRequest.get(`/tryout/${tryoutId}/skd-ranking`);
  return res.data?.payload;
};
