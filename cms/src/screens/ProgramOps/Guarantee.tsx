import { useEffect, useState } from "react";
import { Button, Form, Input, message, Modal, Select, Space, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { apiGetGuaranteeClaims, apiGetPrograms, apiReviewGuaranteeClaim, GuaranteeClaim } from "../../api/programOps";
import { getErrorMessage } from "../../helpers/errorHandler";

const { Title, Text } = Typography;

const GuaranteeScreen = () => {
  const [claims, setClaims] = useState<GuaranteeClaim[]>([]);
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([]);
  const [status, setStatus] = useState<string | undefined>("PENDING");
  const [reviewing, setReviewing] = useState<GuaranteeClaim>();
  const [form] = Form.useForm();

  const load = () =>
    apiGetGuaranteeClaims(status)
      .then(setClaims)
      .catch((err) => message.error(getErrorMessage(err)));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  useEffect(() => {
    apiGetPrograms().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  const review = async (approve: boolean) => {
    if (!reviewing) return;
    const values = approve ? await form.validateFields() : form.getFieldsValue();
    try {
      await apiReviewGuaranteeClaim(reviewing.claim_id, { approve, ...values });
      message.success(approve ? "Klaim disetujui; peserta terdaftar di gelombang tujuan." : "Klaim ditolak");
      setReviewing(undefined);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const programName = (id?: string) => programs.find((program) => program.program_id === id)?.name || "-";

  return (
    <div>
      <Title level={3}>Klaim Garansi Naik Kelas</Title>
      <Text type="secondary">
        Peserta yang sudah menyelesaikan semua TO tetapi skor akhirnya tidak lebih tinggi dari TO pertama bisa mengulang satu
        siklus kelas tanpa biaya.
      </Text>
      <div style={{ margin: "16px 0" }}>
        <Select
          allowClear
          value={status}
          placeholder="Semua status"
          style={{ width: 180 }}
          onChange={setStatus}
          options={["PENDING", "APPROVED", "REJECTED"].map((value) => ({ value, label: value }))}
        />
      </div>
      <Table
        rowKey="claim_id"
        dataSource={claims}
        scroll={{ x: true }}
        columns={[
          {
            title: "Peserta",
            render: (_, row: GuaranteeClaim) => (
              <Space direction="vertical" size={0}>
                <Text>{row.user?.name}</Text>
                <Text type="secondary">{row.user?.email}</Text>
                <Text type="secondary">{row.user?.phone_number}</Text>
              </Space>
            ),
          },
          { title: "Program", render: (_, row: GuaranteeClaim) => programName(row.program_id) },
          { title: "Skor TO pertama → terakhir", render: (_, row: GuaranteeClaim) => `${row.first_score} → ${row.last_score}` },
          { title: "Diajukan", render: (_, row: GuaranteeClaim) => dayjs(row.created_at).format("DD MMM YYYY") },
          {
            title: "Status",
            render: (_, row: GuaranteeClaim) => (
              <Space direction="vertical" size={0}>
                <Tag color={row.status === "APPROVED" ? "green" : row.status === "REJECTED" ? "red" : "gold"}>{row.status}</Tag>
                {row.target_program_id && <Text type="secondary">ke {programName(row.target_program_id)}</Text>}
              </Space>
            ),
          },
          {
            title: "",
            render: (_, row: GuaranteeClaim) =>
              row.status === "PENDING" ? (
                <Button
                  size="small"
                  onClick={() => {
                    form.resetFields();
                    setReviewing(row);
                  }}
                >
                  Tinjau
                </Button>
              ) : null,
          },
        ]}
      />
      <Modal
        open={Boolean(reviewing)}
        title="Tinjau klaim garansi"
        onCancel={() => setReviewing(undefined)}
        footer={[
          <Button key="reject" danger onClick={() => review(false)}>
            Tolak
          </Button>,
          <Button key="approve" type="primary" onClick={() => review(true)}>
            Setujui
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="target_program_id" label="Gelombang tujuan (untuk disetujui)" rules={[{ required: true, message: "Pilih gelombang tujuan" }]}>
            <Select
              options={programs.filter((program) => program.program_id !== reviewing?.program_id).map((program) => ({ value: program.program_id, label: program.name }))}
            />
          </Form.Item>
          <Form.Item name="admin_note" label="Catatan">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        <Text type="secondary">Disetujui = peserta mendapat paket yang sama di gelombang tujuan secara gratis.</Text>
      </Modal>
    </div>
  );
};

export default GuaranteeScreen;
