import { useEffect, useState } from 'react';
import { Alert, Button, Result, Space, Spin } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { verifyCertificate } from '../../api/myProgram';
import { getErrorMessage } from '../../helpers/errorMessage';
import { CertificateProps } from '../../types/myProgram.type';
import './Certificate.css';

/** Public certificate page; doubles as the verification page for its number. */
const CertificateScreen = () => {
  const { number = '' } = useParams();
  const [certificate, setCertificate] = useState<CertificateProps>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    verifyCertificate(number)
      .then(setCertificate)
      .catch((err) => setError(getErrorMessage(err, 'Sertifikat tidak ditemukan')));
  }, [number]);

  if (error) {
    return <Result status="404" title="Sertifikat tidak ditemukan" subTitle={`Nomor ${number} tidak terdaftar.`} />;
  }
  if (!certificate) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/sertifikat/${certificate.certificate_number}`;

  return (
    <div className="certificate-page">
      <Alert
        type="success"
        showIcon
        message="Sertifikat terverifikasi"
        description={`Sertifikat ini terdaftar di TELISIK. Tautan verifikasi: ${verifyUrl}`}
      />
      <div className="certificate-sheet">
        <div className="certificate-meta">TERAS BELAJAR ASIK · TELISIK</div>
        <h1>SERTIFIKAT</h1>
        <div>diberikan kepada</div>
        <div>
          <span className="certificate-name">{certificate.participant_name}</span>
        </div>
        <div>
          telah menyelesaikan {certificate.tryouts_completed} tryout SKD paket <b>{certificate.package_name}</b>
        </div>
        <div>
          pada program <b>{certificate.program_name}</b>
        </div>
        <div>dengan skor SKD tertinggi {certificate.best_score}</div>
        <div className="certificate-meta" style={{ marginTop: 24 }}>
          No. {certificate.certificate_number} · diterbitkan {dayjs(certificate.issued_at).format('DD MMMM YYYY')}
        </div>
        <div className="certificate-meta">Verifikasi: {verifyUrl}</div>
      </div>
      <Space>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
          Cetak / Simpan PDF
        </Button>
      </Space>
    </div>
  );
};

export default CertificateScreen;
