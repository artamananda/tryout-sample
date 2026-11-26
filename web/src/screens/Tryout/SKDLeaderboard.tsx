import { useEffect, useState } from 'react';
import { Avatar, Card, Empty, Grid, Segmented, Select, Skeleton, Space, Table, Tag, Typography, message } from 'antd';
import type { TableProps } from 'antd';
import { CrownFilled, TrophyFilled, UserOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '../../components/kit/PageHeader';
import UserName from '../../components/kit/UserName';
import { getSKDLeaderboard } from '../../api/skd';
import { getErrorMessage } from '../../helpers/errorMessage';
import type { SKDLeaderboardProps, SKDLeaderboardRow } from '../../types/skd.type';
import './SKDLeaderboard.css';

const { Text } = Typography;

const PAGE_SIZE = 50;
const MEDALS = ['#f5b301', '#94a3b8', '#c2773a'];

const RankBadge = ({ rank }: { rank: number }) =>
  rank <= 3 ? (
    <span className="tl-rank is-medal" style={{ background: MEDALS[rank - 1] }}>
      {rank}
    </span>
  ) : (
    <span className="tl-rank">{rank}</span>
  );

const PersonAvatar = ({ row, size }: { row: SKDLeaderboardRow; size: number }) => (
  <Avatar size={size} src={row.picture_url || undefined} icon={<UserOutlined />} style={{ background: '#2563eb', flex: 'none' }} />
);

/** Public SKD ranking of a tryout: everyone who finished, with photo and badges. */
const SKDLeaderboardScreen = () => {
  const { id = '' } = useParams();
  const screens = Grid.useBreakpoint();
  const [data, setData] = useState<SKDLeaderboardProps>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<'national' | 'province'>('national');
  const [province, setProvince] = useState<string>();

  useEffect(() => {
    setLoading(true);
    getSKDLeaderboard(id, { page, limit: PAGE_SIZE, province: scope === 'province' ? province : undefined })
      .then((result) => {
        setData(result);
        // Default the province filter to the viewer's own province.
        if (!province && result.me?.province) setProvince(result.me.province);
      })
      .catch((err) => message.error(getErrorMessage(err, 'Peringkat belum tersedia')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, scope, province]);

  const changeScope = (value: string | number) => {
    // Without a province of their own, start with the biggest province.
    if (value === 'province' && !province && data?.provinces.length) {
      const biggest = [...data.provinces].sort((a, b) => b.participants - a.participants)[0];
      setProvince(biggest.province);
    }
    setScope(value as 'national' | 'province');
    setPage(1);
  };

  const podium = page === 1 ? (data?.rows || []).slice(0, 3) : [];

  const columns: TableProps<SKDLeaderboardRow>['columns'] = [
    { title: '#', key: 'rank', width: 64, fixed: screens.md ? 'left' : undefined, render: (_, row) => <RankBadge rank={row.rank} /> },
    {
      title: 'Peserta',
      key: 'name',
      width: 300,
      fixed: screens.md ? 'left' : undefined,
      render: (_, row) => (
        <Space size={12}>
          <PersonAvatar row={row} size={40} />
          <div style={{ minWidth: 0, maxWidth: 220 }}>
            <UserName userId={row.user_id} name={row.name} badges={row.badges} />
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              {row.province || 'Provinsi belum diisi'}
              {row.is_me && ' · Kamu'}
            </Text>
            {/* Phones show the score columns only after scrolling; keep the total in view. */}
            {!screens.md && (
              <Text strong style={{ display: 'block', fontSize: 13 }}>
                Total {row.total_score}
              </Text>
            )}
          </div>
        </Space>
      )
    },
    { title: 'TWK', key: 'twk', width: 80, align: 'center', render: (_, row) => row.scores.twk },
    { title: 'TIU', key: 'tiu', width: 80, align: 'center', render: (_, row) => row.scores.tiu },
    { title: 'TKP', key: 'tkp', width: 80, align: 'center', render: (_, row) => row.scores.tkp },
    {
      title: 'Total',
      key: 'total',
      width: 90,
      align: 'center',
      render: (_, row) => <Text strong style={{ fontSize: 16 }}>{row.total_score}</Text>
    },
    {
      title: 'Passing Grade',
      key: 'passed',
      width: 130,
      render: (_, row) => <Tag color={row.passed_all ? 'green' : 'default'}>{row.passed_all ? 'Lulus' : 'Belum'}</Tag>
    }
  ];

  const subtitle = data
    ? `${data.participants.toLocaleString('id-ID')} peserta selesai · ${
        data.is_final ? 'peringkat final' : `sementara, bisa berubah sampai ${dayjs(data.final_at).format('DD MMM YYYY HH:mm')}`
      }`
    : 'Memuat peringkat...';

  return (
    <div className="tl-page tl-leaderboard">
      <PageHeader
        back={-1}
        title={data ? `Peringkat ${data.title}` : 'Peringkat SKD'}
        subtitle={subtitle}
        extra={
          <Space wrap>
            <Segmented
              value={scope}
              onChange={changeScope}
              options={[
                { label: 'Nasional', value: 'national' },
                { label: 'Provinsi', value: 'province' }
              ]}
            />
            {scope === 'province' && (
              <Select
                showSearch
                style={{ minWidth: 220 }}
                placeholder="Pilih provinsi"
                value={province}
                onChange={(value) => {
                  setProvince(value);
                  setPage(1);
                }}
                options={(data?.provinces || []).map((item) => ({
                  value: item.province,
                  label: `${item.province} (${item.participants})`
                }))}
              />
            )}
          </Space>
        }
      />

      {data?.me && (
        <Card className="tl-card tl-leaderboard-me">
          <div className="tl-leaderboard-me-row">
            <TrophyFilled style={{ fontSize: 28, color: '#f5b301' }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text type="secondary">Posisi kamu{scope === 'province' && province ? ` di ${province}` : ' nasional'}</Text>
              <div className="tl-leaderboard-me-rank">
                #{data.me.rank} <span>dari {data.participants.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">Total skor</Text>
              <div className="tl-leaderboard-me-rank">{data.me.total_score}</div>
            </div>
          </div>
        </Card>
      )}

      {loading && !data ? (
        <Card className="tl-card">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
      ) : !data || data.participants === 0 ? (
        <Card className="tl-card">
          <Empty description="Belum ada peserta yang menyelesaikan tryout ini." />
        </Card>
      ) : (
        <>
          {podium.length > 0 && (
            <div className="tl-podium">
              {podium.map((row) => (
                <Card key={row.user_id} className={`tl-card tl-podium-card is-rank-${row.rank}${row.is_me ? ' is-me' : ''}`}>
                  <div className="tl-podium-medal" style={{ background: MEDALS[row.rank - 1] }}>
                    {row.rank === 1 ? <CrownFilled /> : row.rank}
                  </div>
                  <PersonAvatar row={row} size={row.rank === 1 ? 84 : 68} />
                  <div className="tl-podium-name">
                    <UserName userId={row.user_id} name={row.name} badges={row.badges} showPackage={false} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {row.province || '-'}
                  </Text>
                  <div className="tl-podium-score">{row.total_score}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    TWK {row.scores.twk} · TIU {row.scores.tiu} · TKP {row.scores.tkp}
                  </Text>
                </Card>
              ))}
            </div>
          )}

          <Card className="tl-card" bodyStyle={{ padding: 0 }}>
            <Table
              rowKey="user_id"
              columns={columns}
              dataSource={data.rows}
              loading={loading}
              scroll={{ x: 'max-content' }}
              rowClassName={(row) => (row.is_me ? 'tl-leaderboard-row-me' : '')}
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total: data.participants,
                showSizeChanger: false,
                onChange: setPage,
                showTotal: (total) => `${total.toLocaleString('id-ID')} peserta`
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default SKDLeaderboardScreen;
