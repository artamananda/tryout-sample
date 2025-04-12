import { Button, Card } from 'antd';
import './style.css';

const SuccessRegisterBatch5 = () => {
  return (
    <Card className="card">
      <div
        style={{
          fontSize: 20,
          marginBottom: 20,
          fontWeight: 'bold'
        }}
      >
        Pendaftaran Sukses!
      </div>
      <div
        style={{
          fontSize: 14,
          marginBottom: 20
        }}
      >
        {`Terima kasih telah mendaftar TELISIK Angkatan 5! Silahkan cek email Anda dan bergabung dengan grup WhatsApp kami untuk informasi lebih lanjut.`}
      </div>
      <Button
        type="primary"
        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
        onClick={() =>
          window.open('https://chat.whatsapp.com/Gk8SNcsHmk49ixHrnbjUNx')
        }
      >
        Gabung Grup WhatsApp
      </Button>
    </Card>
  );
};

export default SuccessRegisterBatch5;
