import { Button, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

export const Features = ({ targetDate }: { targetDate: string }) => {
  const calculateTime = () => {
    const diff = +new Date(targetDate) - +new Date();

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: diff <= 0
    };
  };

  const [time, setTime] = useState(calculateTime());

  useEffect(() => {
    const timer = setInterval(() => setTime(calculateTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (time.expired) {
    return (
      <div style={styles.container}>
        <Title style={{ ...styles.text, fontSize: 40 }}>
          🚀 Pendaftaran Telisik Batch 6 Telah Dibuka!
        </Title>
        <div style={{ marginBottom: 20 }}>
          <Text>Segera daftarkan dirimu sebelum kuota habis!</Text>
        </div>
        <Button type="primary" size="large" href="/program">
          Daftar Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Countdown Menuju Pendaftaran</h2>
      <h1 style={styles.dateText}>TELISIK BATCH 6 🚀</h1>

      <div style={styles.timerWrapper}>
        {[
          { label: 'Hari', value: time.days },
          { label: 'Jam', value: time.hours },
          { label: 'Menit', value: time.minutes },
          { label: 'Detik', value: time.seconds }
        ].map((item) => (
          <div key={item.label} style={styles.box}>
            <div style={styles.value}>{item.value}</div>
            <div style={styles.label}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: any = {
  container: {
    padding: 40,
    textAlign: 'center',
    fontFamily: 'Poppins, sans-serif',
    color: '#222',
    background: '#FFFFFF'
  },
  title: {
    fontSize: 28,
    letterSpacing: 2,
    fontWeight: 300,
    color: '#444'
  },
  dateText: {
    fontSize: 36,
    marginBottom: 40,
    color: '#111',
    textShadow: '0px 0px 3px rgba(0,0,0,0.1)'
  },
  timerWrapper: {
    display: 'flex',
    justifyContent: 'center',
    gap: 25,
    flexWrap: 'wrap'
  },
  box: {
    width: 120,
    padding: 20,
    borderRadius: 12,
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0px 4px 15px rgba(0,0,0,0.1)',
    transition: 'transform .3s'
  },
  value: {
    fontSize: 42,
    fontWeight: 700,
    color: '#333'
  },
  label: {
    fontSize: 16,
    opacity: 0.6,
    color: '#666'
  },
  text: {
    color: '#000'
  }
};
