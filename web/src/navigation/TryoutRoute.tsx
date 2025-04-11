import { message, Spin } from 'antd';
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import useFetchList from '../hooks/useFetchList';
import { TransactionTryoutProps } from '../types/transactionTryout';
import { useAuthUser } from 'react-auth-kit';

const TryoutRoute = ({ children, loginPath }: any) => {
  const auth = useAuthUser();
  const location = useLocation();
  const splitLink = window.location.href.split('/');
  const tryoutId = splitLink[splitLink.length - 3];
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);

  const { data: transactionData, isLoading } =
    useFetchList<TransactionTryoutProps>({
      endpoint: `transaction-tryout`,
      initialQuery: {
        tryoutId: tryoutId,
        userId: auth()?.user_id
      }
    });

  const isBeforeStart = (startTime?: string | Date) => {
    if (!startTime) return false;
    const startDate = new Date(startTime);
    const currentDate = new Date();
    return startDate > currentDate;
  };

  const isExpired = (endTime?: string | Date) => {
    if (!endTime) return false;
    const endDate = new Date(endTime);
    const currentDate = new Date();
    return endDate < currentDate;
  };

  React.useEffect(() => {
    if (
      transactionData?.[0]?.is_done ||
      isBeforeStart(transactionData?.[0]?.tryout?.start_time) ||
      isExpired(transactionData?.[0]?.tryout?.end_time)
    ) {
      setIsAuthenticated(false);
    }
  }, [transactionData]);

  if (!isAuthenticated) {
    message.error(
      'Waktu ujian sudah habis, terima kasih telah mengikuti ujian ini.'
    );
    return (
      <Navigate
        to={loginPath || '/tryout'}
        state={{ from: location }}
        replace
      />
    );
  }

  return isLoading ? (
    <div style={{ textAlign: 'center', marginTop: '20%' }}>
      <Spin />
    </div>
  ) : (
    children
  );
};

export default TryoutRoute;
