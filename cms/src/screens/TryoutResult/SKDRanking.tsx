import { useEffect, useState } from "react";
import { Alert, Button, message, Space, Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { Excel } from "antd-table-saveas-excel";
import { useNavigate, useParams } from "react-router-dom";
import { apiGetSKDRanking } from "../../api/package";
import { getErrorMessage } from "../../helpers/errorHandler";
import UserName from "../../components/kit/UserName";
import type { UserBadges as UserBadgesData } from "../../types/badge.type";

const { Title, Text } = Typography;

type RankingRow = {
  rank: number;
  user_id: string;
  name: string;
  phone_number: string;
  province: string;
  badges?: UserBadgesData;
  scores: Record<string, number>;
  total_score: number;
  passed_all: boolean;
  weakest_subtest: string;
};

type Ranking = { title: string; is_final: boolean; participants: number; rows: RankingRow[] };

/** National SKD ranking of a tryout, with phone numbers for the WhatsApp follow-up. */
const SKDRankingScreen = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<Ranking>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGetSKDRanking(id)
      .then(setRanking)
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id]);

  const columns: TableProps<RankingRow>["columns"] = [
    { title: "Peringkat", dataIndex: "rank", width: 90 },
    {
      title: "Nama",
      dataIndex: "name",
      render: (_, row) => (
        <UserName userId={row.user_id} name={row.name} badges={row.badges} />
      ),
    },
    { title: "WhatsApp", dataIndex: "phone_number" },
    { title: "Provinsi", dataIndex: "province" },
    { title: "TWK", render: (_, row) => row.scores.twk },
    { title: "TIU", render: (_, row) => row.scores.tiu },
    { title: "TKP", render: (_, row) => row.scores.tkp },
    { title: "Total", dataIndex: "total_score" },
    {
      title: "Passing Grade",
      render: (_, row) => <Tag color={row.passed_all ? "green" : "red"}>{row.passed_all ? "Lulus" : "Belum"}</Tag>,
    },
    { title: "Subtes Terlemah", render: (_, row) => row.weakest_subtest.toUpperCase() },
  ];

  const exportExcel = () => {
    if (!ranking) return;
    const rows = ranking.rows.map((row) => ({
      rank: row.rank,
      name: row.name,
      verified: row.badges?.verified?.label_name || "",
      package: row.badges?.package?.name || "",
      phone_number: row.phone_number,
      province: row.province,
      twk: row.scores.twk,
      tiu: row.scores.tiu,
      tkp: row.scores.tkp,
      total_score: row.total_score,
      passed_all: row.passed_all ? "Lulus" : "Belum",
      weakest_subtest: row.weakest_subtest.toUpperCase(),
    }));
    new Excel()
      .addSheet("ranking")
      .addColumns([
        { title: "Peringkat", dataIndex: "rank" },
        { title: "Nama", dataIndex: "name" },
        { title: "Terverifikasi", dataIndex: "verified" },
        { title: "Paket", dataIndex: "package" },
        { title: "WhatsApp", dataIndex: "phone_number" },
        { title: "Provinsi", dataIndex: "province" },
        { title: "TWK", dataIndex: "twk" },
        { title: "TIU", dataIndex: "tiu" },
        { title: "TKP", dataIndex: "tkp" },
        { title: "Total", dataIndex: "total_score" },
        { title: "Passing Grade", dataIndex: "passed_all" },
        { title: "Subtes Terlemah", dataIndex: "weakest_subtest" },
      ])
      .addDataSource(rows)
      .saveAs(`ranking_skd_${id}.xlsx`);
  };

  return (
    <div>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate("/tryout")} style={{ paddingLeft: 0 }}>
        Tryout
      </Button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0 }}>
            Ranking SKD {ranking?.title}
          </Title>
          {ranking && (
            <Text type="secondary">
              {ranking.participants} peserta selesai · {ranking.is_final ? "final" : "sementara (tryout masih dibuka)"}
            </Text>
          )}
        </Space>
        <Button icon={<DownloadOutlined />} disabled={!ranking?.rows.length} onClick={exportExcel}>
          Ekspor Excel
        </Button>
      </div>
      <Alert
        style={{ margin: "16px 0" }}
        type="info"
        showIcon
        message="Data berisi nomor WhatsApp peserta. Gunakan hanya untuk mengirim hasil dan penawaran kepada peserta yang setuju dihubungi."
      />
      <Table rowKey="user_id" loading={isLoading} columns={columns} dataSource={ranking?.rows || []} scroll={{ x: true }} />
    </div>
  );
};

export default SKDRankingScreen;
