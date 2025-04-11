import { message, Spin } from 'antd';
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import useFetchList from '../hooks/useFetchList';
import { TransactionTryoutProps } from '../types/transactionTryout';
import { useAuthUser } from 'react-auth-kit';
import dayjs from 'dayjs';

const TryoutRoute = ({ children, loginPath }: any) => {
  const auth = useAuthUser();
  const location = useLocation();
  const splitLink = window.location.href.split('/');
  const tryoutId = splitLink[splitLink.length - 3];
  const [isDone, setIsDone] = React.useState(false);
  const [isNotStarted, setIsNotStarted] = React.useState(false);
  const [isExpired, setIsExpired] = React.useState(false);

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
    const startDate = dayjs(startTime);
    const currentDate = new Date();
    return startDate.isBefore(currentDate);
  };

  const isAfterEnd = (endTime?: string | Date) => {
    if (!endTime) return false;
    const endDate = dayjs(endTime);
    const currentDate = new Date();
    return endDate.isAfter(currentDate);
  };

  React.useEffect(() => {
    if (isBeforeStart(transactionData?.[0]?.tryout?.start_time)) {
      setIsNotStarted(true);
    } else if (transactionData?.[0]?.is_done) {
      setIsDone(true);
    } else if (isAfterEnd(transactionData?.[0]?.tryout?.end_time)) {
      setIsExpired(true);
    }
  }, [transactionData]);

  if (isDone || isNotStarted || isExpired) {
    if (isDone) {
      message.error(
        'Waktu ujian sudah habis, terima kasih telah mengikuti ujian ini.'
      );
    } else if (isNotStarted) {
      message.error(
        'Ujian belum dimulai, silahkan tunggu hingga waktu ujian dimulai.'
      );
    } else {
      message.error('Silahkan hubungi admin untuk mendapatkan akses ujian.');
    }
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
