import { useEffect, useState } from "react";
import { Button, Form, Input, message, Modal, Select, Space, Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { apiGetOrders, apiMarkOrderPaid } from "../../api/package";
import { getErrorMessage } from "../../helpers/errorHandler";
import { formatRupiah, ORDER_STATUS_COLOR, OrderProps } from "../../types/package.type";

const { Title, Text, Link } = Typography;
const PAGE_SIZE = 50;

const OrdersScreen = () => {
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("program_id") || undefined;
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [marking, setMarking] = useState<OrderProps>();
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setIsLoading(true);
      const result = await apiGetOrders({
        program_id: programId,
        status,
        search,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setOrders(result.results);
      setTotal(result.count);
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, status, page]);

  const confirmPaid = async () => {
    if (!marking) return;
    const values = await form.validateFields();
    try {
      await apiMarkOrderPaid(marking.order_id, values);
      message.success(`Pesanan ${marking.order_number} ditandai lunas; paket sudah aktif.`);
      setMarking(undefined);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const columns: TableProps<OrderProps>["columns"] = [
    {
      title: "Pesanan",
      render: (_, order) => (
        <Space direction="vertical" size={0}>
          <Text strong copyable>
            {order.order_number}
          </Text>
          <Text type="secondary">{dayjs(order.created_at).format("DD MMM YYYY HH:mm")}</Text>
        </Space>
      ),
    },
    {
      title: "Peserta",
      render: (_, order) => (
        <Space direction="vertical" size={0}>
          <Text>{order.user?.name}</Text>
          <Text type="secondary">{order.user?.email}</Text>
          {order.user?.phone_number && (
            <Link href={`https://wa.me/${order.user.phone_number}`} target="_blank" rel="noreferrer">
              {order.user.phone_number}
            </Link>
          )}
        </Space>
      ),
    },
    { title: "Paket", render: (_, order) => order.package.name },
    { title: "Total", render: (_, order) => (order.amount === 0 ? "Gratis" : formatRupiah(order.amount)) },
    {
      title: "Status",
      render: (_, order) => (
        <Space direction="vertical" size={0}>
          <Tag color={ORDER_STATUS_COLOR[order.status]}>{order.status}</Tag>
          {order.payment_method && <Text type="secondary">{order.payment_method}</Text>}
          {order.paid_at && <Text type="secondary">{dayjs(order.paid_at).format("DD MMM HH:mm")}</Text>}
        </Space>
      ),
    },
    {
      title: "Aksi",
      render: (_, order) =>
        order.status !== "PAID" && order.amount > 0 ? (
          <Button
            size="small"
            onClick={() => {
              form.resetFields();
              setMarking(order);
            }}
          >
            Tandai Lunas
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <Title level={3}>Pesanan Paket</Title>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Semua status"
          style={{ width: 180 }}
          value={status}
          onChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          options={["PENDING", "PAID", "EXPIRED", "CANCELLED", "FAILED"].map((value) => ({ value, label: value }))}
        />
        <Input.Search
          allowClear
          placeholder="No. pesanan, nama, email, atau nomor WA"
          style={{ width: 320 }}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={() => {
            setPage(1);
            load();
          }}
        />
        {programId && <Tag>Filter program aktif</Tag>}
      </Space>

      <Table
        rowKey="order_id"
        loading={isLoading}
        columns={columns}
        dataSource={orders}
        scroll={{ x: true }}
        pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: setPage, showSizeChanger: false }}
      />

      <Modal
        open={Boolean(marking)}
        title={`Tandai lunas ${marking?.order_number || ""}`}
        okText="Tandai Lunas"
        onOk={confirmPaid}
        onCancel={() => setMarking(undefined)}
        destroyOnClose
      >
        <Text type="secondary">
          Pakai hanya bila pembayaran sudah dipastikan masuk (mis. callback Midtrans tidak sampai). Paket langsung aktif
          untuk peserta.
        </Text>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="payment_method" label="Metode pembayaran" rules={[{ required: true, message: "Wajib diisi" }]}>
            <Input placeholder="mis. qris, transfer BCA" />
          </Form.Item>
          <Form.Item name="reference" label="Referensi" extra="mis. transaction_id Midtrans atau nomor bukti transfer">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersScreen;
