import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { message } from 'antd';

type Props = {
  startTime: Date | string;
  duration: number;
};

const Timer = (props: Props) => {
  const navigate = useNavigate();
  const startTime = dayjs(props.startTime);
  const initialTime = startTime
    .add(props.duration, 'minute')
    .diff(dayjs(), 'second');

  const [remainingTime, setRemainingTime] = useState(initialTime);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTime((prevRemainingTime) => prevRemainingTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (remainingTime < 0) {
      message.info(
        'Waktu ujian sudah habis, terima kasih telah mengikuti ujian ini.'
      );
      navigate('/tryout');
      setRemainingTime(0);
    }
  }, [remainingTime]);

  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;

  return remainingTime > 0 ? (
    <div style={{ color: hours < 1 && minutes < 5 ? 'red' : 'white' }}>
      {`${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
    </div>
  ) : (
    <div style={{ color: 'red' }}>Waktu Habis!</div>
  );
};

export default Timer;
