import { AxiosInstance } from 'axios';
import React from 'react';
import { useDebounce } from 'use-debounce';
import { httpRequest } from '../helpers/api';
import { generateQueryString } from '../helpers/generateQueryString';
import {
  IHttpResponse,
  INITIAL_PAGINATION,
  INITIAL_QUERY,
  IPagination,
  IPayloadPagination,
  IQuery
} from '../helpers/pagination';

type Props = {
  endpoint: string;
  initialQuery?: Object;
  limit?: number;
  pushData?: boolean;
  apiRequest?: AxiosInstance;
  fetchable?: boolean;
};

const DEFAULT_LIMIT = 25;

export default function useFetchList<DataType, ExtendType = {}>(props: Props) {
  const fetchable = props.fetchable === undefined ? true : props.fetchable;
  const apiRequest: AxiosInstance = props.apiRequest || httpRequest;
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<Array<DataType>>([]);
  const [pagination, setPagination] = React.useState<IPagination>({
    ...INITIAL_PAGINATION,
    perPage: props.limit || DEFAULT_LIMIT
  } as IPagination);
  const [query, setQuery] = React.useState<IQuery<ExtendType>>({
    ...INITIAL_QUERY,
    limit: props.limit || DEFAULT_LIMIT,
    ...props.initialQuery
  } as IQuery<ExtendType>);

  const [search, setSearch] = React.useState<string>();
  const [searchValue] = useDebounce(search, 500);

  const fetchList = async () => {
    if (!fetchable) {
      return;
    }
    try {
      setIsLoading(true);

      const res = await apiRequest.get<
        IHttpResponse<IPayloadPagination<DataType>>
      >(`${props.endpoint}${generateQueryString(query)}`);
      console.log('data', res);

      setPagination((oldVal) => {
        return {
          ...oldVal,
          perPage: oldVal.perPage || props.limit || DEFAULT_LIMIT,
          prev: res.data.payload?.prev,
          next: res.data.payload?.next,
          totalData: res.data.payload?.count,
          countPage: Math.ceil(
            res.data.payload?.count / (props.limit || DEFAULT_LIMIT)
          )
        };
      });

      if (props.pushData) {
        setData((value) => [...value, ...res.data.payload.results]);
      } else {
        setData(res.data.payload.results);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchList();

    // eslint-disable-next-line
  }, [query]);

  React.useEffect(() => {
    setQuery((e: IQuery<ExtendType>) => {
      return { ...e, search: searchValue as string };
    });
  }, [searchValue]);

  const changePage = (page: any, perPage: number) => {
    setPagination((oldVal) => {
      return {
        ...oldVal,
        page,
        perPage
      };
    });
    setQuery((oldVal) => {
      return {
        ...oldVal,
        limit: perPage,
        offset: (page - 1) * (perPage || props.limit || DEFAULT_LIMIT)
      };
    });
  };

  const changeLimit = (perPage: number) => {
    setPagination((oldVal) => {
      return {
        ...oldVal,
        perPage
      };
    });
    setQuery((oldVal) => {
      return {
        ...oldVal,
        limit: perPage,
        offset: 0
      };
    });
  };

  return {
    DEFAULT_LIMIT,
    isLoading,
    data,
    pagination,
    query,
    setData,
    setPagination,
    setQuery,
    search,
    setSearch,
    changePage,
    fetchList,
    setIsLoading,
    changeLimit
  };
}
