import { useEffect, useState } from 'react';
import { Button, Card, Empty, List, message, Spin, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getMyOrders } from '../../api/package';
import { getErrorMessage } from '../../helpers/errorMessage';
import { formatRupiah, ORDER_STATUS_LABEL, OrderProps } from '../../types/package.type';

const { Text, Title } = Typography;

const MyOrdersScreen = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Title level={3}>Pesanan Saya</Title>
      {orders.length === 0 ? (
        <Empty description="Belum ada pesanan">
          <Button type="primary" onClick={() => navigate('/paket')}>
            Lihat Paket
          </Button>
        </Empty>
      ) : (
        <List
          dataSource={orders}
          renderItem={(order) => {
            const status = ORDER_STATUS_LABEL[order.status] || { label: order.status, color: 'default' };
            return (
              <Card
                style={{ marginBottom: 12, cursor: 'pointer' }}
                onClick={() => navigate(`/pesanan/${order.order_number}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <Text strong>Paket {order.package.name}</Text>
                    <br />
                    <Text type="secondary">
                      {order.order_number} · {dayjs(order.created_at).format('DD MMM YYYY HH:mm')}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text strong>{order.amount === 0 ? 'Gratis' : formatRupiah(order.amount)}</Text>
                    <br />
                    <Tag color={status.color}>{status.label}</Tag>
                  </div>
                </div>
              </Card>
            );
          }}
        />
      )}
    </div>
  );
};

export default MyOrdersScreen;
