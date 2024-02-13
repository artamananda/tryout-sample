export type IPagination = {
  page: number;
  perPage: number;
  totalData: number;
  countPage: number;
  prev: string;
  next: string;
};

export const INITIAL_PAGINATION: IPagination = {
  page: 1,
  perPage: 25,
  totalData: 0,
  countPage: 1,
  next: "",
  prev: "",
};

export type IQuery<ExtendType> = ExtendType & {
  offset?: number;
  limit?: number;
};

export const INITIAL_QUERY = {
  offset: 0,
  limit: 25,
};

export type IPayloadPagination<ResultItem> = {
  next: string;
  prev: string;
  count: number;
  results: Array<ResultItem>;
};

export interface IHttpResponse<Payload> {
  code: string;
  message: string;
  payload: Payload;
}
