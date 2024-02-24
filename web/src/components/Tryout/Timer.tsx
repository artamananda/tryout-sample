import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const Timer = () => {
  const targetTime = dayjs().add(195, 'minute');

  const [remainingTime, setRemainingTime] = useState(
    targetTime.diff(dayjs(), 'millisecond') / 1000
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTime((prevRemainingTime) => prevRemainingTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default Timer;
