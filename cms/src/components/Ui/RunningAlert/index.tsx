import React from 'react';
import { Alert } from 'antd';
import Marquee from 'react-fast-marquee';

const RunningAlert: React.FC = () => (
  <Alert
    banner
    message={
      <Marquee
        pauseOnHover
        gradient={false}
      >
        Tipe soal belum diaktifkan, mohon untuk klik switch di samping untuk menentukan tipe mode pertanyaan, lalu save!!
      </Marquee>
    }
  />
);

export default RunningAlert;
