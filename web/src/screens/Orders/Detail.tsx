import { useEffect, useRef, useState } from 'react';
import { Button, Card, Descriptions, Result, Spin, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getOrder } from '../../api/package';
import { getErrorMessage } from '../../helpers/errorMessage';
import { formatRupiah, ORDER_STATUS_LABEL, OrderProps } from '../../types/package.type';

const POLL_INTERVAL_MS = 5000;
const POLL_LIMIT = 36; // about 3 minutes after returning from Midtrans

/** Order status page; Midtrans sends the buyer back here after paying. */
const OrderDetailScreen = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderProps>();
  const [error, setError] = useState<string>();
  const polls = useRef(0);

  useEffect(() => {
    if (!orderNumber) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const load = async () => {
      try {
        const result = await getOrder(orderNumber);
        if (cancelled) return;
        setOrder(result);
        // The bridge confirms the payment a little after Midtrans redirects.
        if (result.status === 'PENDING' && polls.current < POLL_LIMIT) {
          polls.current += 1;
          timer = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Pesanan tidak ditemukan'));
      }
    };
    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderNumber]);

  if (error) {
    return <Result status="404" title="Pesanan tidak ditemukan" subTitle={error} />;
  }
  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const status = ORDER_STATUS_LABEL[order.status] || { label: order.status, color: 'default' };

  const summary = (
    <Descriptions column={1} size="small" bordered style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
      <Descriptions.Item label="No. Pesanan">{order.order_number}</Descriptions.Item>
      <Descriptions.Item label="Paket">{order.package.name}</Descriptions.Item>
      <Descriptions.Item label="Total">{order.amount === 0 ? 'Gratis' : formatRupiah(order.amount)}</Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={status.color}>{status.label}</Tag>
      </Descriptions.Item>
      {order.paid_at && (
        <Descriptions.Item label="Dibayar">{dayjs(order.paid_at).format('DD MMM YYYY HH:mm')}</Descriptions.Item>
      )}
      {order.status === 'PENDING' && order.expires_at && (
        <Descriptions.Item label="Bayar sebelum">{dayjs(order.expires_at).format('DD MMM YYYY HH:mm')}</Descriptions.Item>
      )}
    </Descriptions>
  );

  if (order.status === 'PAID') {
    return (
      <Card>
        <Result
          status="success"
          title={`Paket ${order.package.name} aktif`}
          subTitle="Tryout dan kelas sesuai paket sudah bisa diakses."
          extra={[
            <Button type="primary" key="tryout" onClick={() => navigate('/tryout')}>
              Lihat Tryout
            </Button>,
            <Button key="orders" onClick={() => navigate('/pesanan')}>
              Pesanan Saya
            </Button>
          ]}
        >
          {summary}
        </Result>
      </Card>
    );
  }

  if (order.status === 'PENDING') {
    return (
      <Card>
        <Result
          status="info"
          title="Menunggu pembayaran"
          subTitle="Halaman ini akan diperbarui otomatis setelah pembayaran diterima."
          extra={[
            order.payment_url && (
              <Button type="primary" key="pay" onClick={() => window.location.assign(order.payment_url!)}>
                Bayar Sekarang
              </Button>
            ),
            <Button key="reload" onClick={() => window.location.reload()}>
              Cek Status
            </Button>
          ]}
        >
          {summary}
        </Result>
      </Card>
    );
  }

  return (
    <Card>
      <Result
        status="warning"
        title={`Pesanan ${status.label.toLowerCase()}`}
        subTitle="Silakan pilih paket lagi untuk membuat pesanan baru."
        extra={[
          <Button type="primary" key="packages" onClick={() => navigate(`/program/${order.program_id}/paket`)}>
            Pilih Paket
          </Button>
        ]}
      >
        {summary}
      </Result>
    </Card>
  );
};

export default OrderDetailScreen;
