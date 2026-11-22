import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, message, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { Excel } from "antd-table-saveas-excel";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { apiGetTutorFees } from "../../api/programOps";
import { getErrorMessage } from "../../helpers/errorHandler";
import { formatRupiah } from "../../types/package.type";

const { Title, Text } = Typography;

type FeeClass = {
  class_id: string;
  sequence: number;
  title: string;
  tutor_name: string;
  starts_at: string;
  finished: boolean;
  participants: number;
  attendees: number;
  rating_avg: number;
  rating_count: number;
  gross_fee: number;
  minimum_applied: boolean;
  fee: number;
};

type FeeTutor = {
  tutor_name: string;
  classes: number;
  class_fee: number;
  rating_avg: number;
  rating_count: number;
  bonus: number;
  mentoring_sessions: number;
  mentoring_fee: number;
  total: number;
};

type Report = {
  program_name: string;
  revenue: number;
  classes: FeeClass[];
  tutors: FeeTutor[];
  question_pool_fee: number;
  total_tutor_fee: number;
  notes: string[];
};

const TutorFeesScreen = () => {
  const { programId = "" } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report>();

  useEffect(() => {
    apiGetTutorFees(programId)
      .then(setReport)
      .catch((err) => message.error(getErrorMessage(err)));
  }, [programId]);

  const exportExcel = () => {
    if (!report) return;
    const excel = new Excel();
    excel
      .addSheet("per tutor")
      .addColumns([
        { title: "Tutor", dataIndex: "tutor_name" },
        { title: "Kelas", dataIndex: "classes" },
        { title: "Fee kelas", dataIndex: "class_fee" },
        { title: "Rating", dataIndex: "rating_avg" },
        { title: "Bonus", dataIndex: "bonus" },
        { title: "Sesi mentoring", dataIndex: "mentoring_sessions" },
        { title: "Fee mentoring", dataIndex: "mentoring_fee" },
        { title: "Total", dataIndex: "total" },
      ])
      .addDataSource(report.tutors)
      .addSheet("per kelas")
      .addColumns([
        { title: "Kelas", dataIndex: "sequence" },
        { title: "Judul", dataIndex: "title" },
        { title: "Tutor", dataIndex: "tutor_name" },
        { title: "Tanggal", dataIndex: "date" },
        { title: "Peserta berhak", dataIndex: "participants" },
        { title: "Hadir", dataIndex: "attendees" },
        { title: "Rating", dataIndex: "rating_avg" },
        { title: "Fee bruto", dataIndex: "gross_fee" },
        { title: "Fee dibayar", dataIndex: "fee" },
      ])
      .addDataSource(report.classes.map((item) => ({ ...item, date: dayjs(item.starts_at).format("DD MMM YYYY") })))
      .saveAs(`fee_tutor_${programId}.xlsx`);
  };

  return (
    <div>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate("/program")} style={{ paddingLeft: 0 }}>
        Program
      </Button>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          Fee Tutor {report?.program_name}
        </Title>
        <Button icon={<DownloadOutlined />} disabled={!report} onClick={exportExcel}>
          Ekspor Excel
        </Button>
      </div>

      {report && (
        <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic title="Pendapatan terbayar" value={formatRupiah(report.revenue)} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic title="Total fee tutor" value={formatRupiah(report.total_tutor_fee)} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic title="Pool soal (paket tanpa kelas)" value={formatRupiah(report.question_pool_fee)} />
              </Card>
            </Col>
          </Row>

          <Card title="Per tutor">
            <Table
              rowKey="tutor_name"
              pagination={false}
              scroll={{ x: true }}
              dataSource={report.tutors}
              columns={[
                { title: "Tutor", dataIndex: "tutor_name" },
                { title: "Kelas", dataIndex: "classes" },
                { title: "Fee kelas", render: (_, row: FeeTutor) => formatRupiah(row.class_fee) },
                { title: "Rating", render: (_, row: FeeTutor) => (row.rating_count ? `${row.rating_avg} (${row.rating_count})` : "-") },
                { title: "Bonus 10%", render: (_, row: FeeTutor) => (row.bonus ? <Tag color="green">{formatRupiah(row.bonus)}</Tag> : "-") },
                { title: "Mentoring", render: (_, row: FeeTutor) => `${row.mentoring_sessions} sesi · ${formatRupiah(row.mentoring_fee)}` },
                { title: "Total", render: (_, row: FeeTutor) => <Text strong>{formatRupiah(row.total)}</Text> },
              ]}
            />
          </Card>

          <Card title="Per kelas">
            <Table
              rowKey="class_id"
              pagination={false}
              scroll={{ x: true }}
              dataSource={report.classes}
              columns={[
                { title: "#", dataIndex: "sequence", width: 50 },
                { title: "Kelas", render: (_, row: FeeClass) => `${row.title} · ${row.tutor_name}` },
                { title: "Tanggal", render: (_, row: FeeClass) => dayjs(row.starts_at).format("DD MMM YYYY") },
                { title: "Peserta berhak / hadir", render: (_, row: FeeClass) => `${row.participants} / ${row.attendees}` },
                { title: "Rating", render: (_, row: FeeClass) => (row.rating_count ? row.rating_avg : "-") },
                { title: "Fee bruto", render: (_, row: FeeClass) => formatRupiah(row.gross_fee) },
                {
                  title: "Dibayar",
                  render: (_, row: FeeClass) =>
                    !row.finished ? (
                      <Tag>Belum terlaksana</Tag>
                    ) : (
                      <Space>
                        {formatRupiah(row.fee)}
                        {row.minimum_applied && <Tag color="blue">minimum</Tag>}
                      </Space>
                    ),
                },
              ]}
            />
          </Card>

          <Alert type="info" showIcon message="Cara hitung" description={<ul style={{ margin: 0, paddingLeft: 18 }}>{report.notes.map((note) => <li key={note}>{note}</li>)}</ul>} />
        </Space>
      )}
    </div>
  );
};

export default TutorFeesScreen;
