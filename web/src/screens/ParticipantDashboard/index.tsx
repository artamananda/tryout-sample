import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Empty, List, Progress, Row, Select, Skeleton, Space, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  FireOutlined,
  RiseOutlined,
  ShoppingOutlined,
  TrophyOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from 'react-auth-kit';
import dayjs from 'dayjs';
import { getMentoring, getMyLiveClasses, getMyPrograms, getProgramProgress } from '../../api/myProgram';
import { httpRequest } from '../../helpers/api';
import { getErrorMessage } from '../../helpers/errorMessage';
import PageHeader from '../../components/kit/PageHeader';
import StatCard from '../../components/kit/StatCard';
import ChartCard from '../../components/kit/ChartCard';
import { brand, chartPalette } from '../../theme/theme';
import { LiveClassProps, MentoringSlotProps, MyProgramProps, ProgramProgressProps } from '../../types/myProgram.type';
import { TryoutProps } from '../../types/tryout.type';
import { UserProperties } from '../../types/user.type';

const { Text } = Typography;

// SKD passing grades (BKN). Kept in sync with the backend SKDSubtests.
const PASSING = { twk: 65, tiu: 80, tkp: 166 };
const MAX = { twk: 150, tiu: 175, tkp: 225 };
const PASSING_TOTAL = PASSING.twk + PASSING.tiu + PASSING.tkp;

type DashboardData = {
  program?: MyProgramProps;
  progress?: ProgramProgressProps;
  classes: LiveClassProps[];
  mentoring: MentoringSlotProps[];
  openTryouts: TryoutProps[];
};

const greeting = () => {
  const hour = dayjs().hour();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
};

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const authUser = useAuthUser();
  const user = authUser() as UserProperties | null;
  const [programs, setPrograms] = useState<MyProgramProps[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [openTryouts, setOpenTryouts] = useState<TryoutProps[]>([]);
  const [data, setData] = useState<DashboardData>({ classes: [], mentoring: [], openTryouts: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  // 1) Programs and open tryouts. Start with the program the participant is
  //    most active in (most completed TOs).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [list, tryoutRes] = await Promise.all([
          getMyPrograms(),
          httpRequest.get('/tryout?is_published=true').catch(() => null)
        ]);
        const now = dayjs();
        const open: TryoutProps[] = (tryoutRes?.data?.payload?.results || []).filter(
          (tryout: TryoutProps) =>
            tryout.has_access !== false && now.isAfter(dayjs(tryout.start_time)) && now.isBefore(dayjs(tryout.end_time))
        );
        let initial = list[0]?.program_id;
        if (list.length > 1) {
          const progresses = await Promise.all(list.map((program) => getProgramProgress(program.program_id).catch(() => undefined)));
          let best = -1;
          progresses.forEach((progress, index) => {
            const done = progress?.completed_count ?? 0;
            if (done > best) {
              best = done;
              initial = list[index].program_id;
            }
          });
        }
        if (cancelled) return;
        setPrograms(list);
        setOpenTryouts(open);
        setSelectedId(initial);
        if (!initial) setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Dashboard tidak dapat dimuat'));
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Everything about the selected program.
  useEffect(() => {
    if (!selectedId) return;
    const program = programs.find((item) => item.program_id === selectedId);
    if (!program) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      getProgramProgress(program.program_id).catch(() => undefined),
      getMyLiveClasses(program.program_id).catch(() => [] as LiveClassProps[]),
      program.mentoring_sessions > 0 ? getMentoring(program.program_id).catch(() => undefined) : Promise.resolve(undefined)
    ])
      .then(([progress, classes, mentoring]) => {
        if (cancelled) return;
        setData({
          program,
          progress,
          classes,
          mentoring: mentoring?.slots.filter((slot) => slot.is_mine && slot.status === 'BOOKED') || [],
          openTryouts
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, programs, openTryouts]);

  const completed = useMemo(() => (data.progress?.tryouts || []).filter((item) => item.completed), [data.progress]);
  const latest = completed[completed.length - 1];
  const previous = completed[completed.length - 2];
  const delta = latest && previous && previous.total_score > 0 ? ((latest.total_score - previous.total_score) / previous.total_score) * 100 : null;

  // Open tryouts the participant has not finished yet.
  const finishedIds = new Set(completed.map((item) => item.tryout_id));
  const pendingTryouts = data.openTryouts.filter((tryout) => !finishedIds.has(tryout.tryout_id));

  const upcomingClasses = data.classes
    .filter((item) => item.has_access && item.status !== 'FINISHED')
    .slice(0, 3);

  const trendOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 40, right: 16, top: 40, bottom: 28 },
    xAxis: { type: 'category', data: completed.map((item) => `TO ${item.sequence}`) },
    yAxis: { type: 'value', min: 0 },
    series: [
      {
        name: 'Total',
        type: 'line',
        smooth: true,
        symbolSize: 8,
        data: completed.map((item) => item.total_score),
        areaStyle: { opacity: 0.12 },
        lineStyle: { width: 3 },
        markLine: {
          symbol: 'none',
          label: { formatter: `Ambang ${PASSING_TOTAL}`, position: 'insideEndTop' },
          lineStyle: { type: 'dashed', color: brand.error },
          data: [{ yAxis: PASSING_TOTAL }]
        }
      },
      { name: 'TWK', type: 'line', smooth: true, data: completed.map((item) => item.scores?.twk ?? 0) },
      { name: 'TIU', type: 'line', smooth: true, data: completed.map((item) => item.scores?.tiu ?? 0) },
      { name: 'TKP', type: 'line', smooth: true, data: completed.map((item) => item.scores?.tkp ?? 0) }
    ]
  };

  const radarOption: EChartsOption = {
    tooltip: {},
    legend: { bottom: 0 },
    radar: {
      radius: '62%',
      indicator: [
        { name: 'TWK', max: MAX.twk },
        { name: 'TIU', max: MAX.tiu },
        { name: 'TKP', max: MAX.tkp }
      ]
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            name: 'Passing grade',
            value: [PASSING.twk, PASSING.tiu, PASSING.tkp],
            lineStyle: { type: 'dashed', color: brand.error },
            itemStyle: { color: brand.error },
            areaStyle: { opacity: 0.04 }
          },
          {
            name: latest ? `Skor ${latest.title}` : 'Skor',
            value: [latest?.scores?.twk ?? 0, latest?.scores?.tiu ?? 0, latest?.scores?.tkp ?? 0],
            itemStyle: { color: chartPalette[0] },
            areaStyle: { opacity: 0.25 }
          }
        ]
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="tl-page">
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[16, 16]}>
          {[0, 1, 2, 3].map((key) => (
            <Col xs={12} lg={6} key={key}>
              <StatCard label="" value="" loading />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  const tryoutLimit = data.progress?.tryout_limit || data.program?.tryout_limit || 0;

  return (
    <div className="tl-page">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'Peserta'}`}
        subtitle={data.program ? `${data.program.program_name} · Paket ${data.program.package_name || '-'}` : 'Mulai persiapan SKD CPNS-mu hari ini.'}
        extra={
          data.program ? (
            <>
              {programs.length > 1 && (
                <Select
                  value={selectedId}
                  onChange={setSelectedId}
                  style={{ minWidth: 200 }}
                  options={programs.map((program) => ({ value: program.program_id, label: program.program_name }))}
                />
              )}
              <Button onClick={() => navigate(`/program-saya?program=${data.program!.program_id}`)}>Program Saya</Button>
              <Button type="primary" onClick={() => navigate('/tryout')}>
                Kerjakan Tryout
              </Button>
            </>
          ) : (
            <Button type="primary" icon={<ShoppingOutlined />} onClick={() => navigate('/paket')}>
              Lihat Paket
            </Button>
          )
        }
      />

      {error && <Alert type="error" showIcon message={error} />}
      {user && !user.phone_number && (
        <Alert
          type="warning"
          showIcon
          message="Lengkapi nomor WhatsApp"
          description="Nomor WhatsApp dibutuhkan untuk memilih paket dan menerima hasil tryout."
          action={
            <Button size="small" onClick={() => navigate('/profile')}>
              Buka Profil
            </Button>
          }
        />
      )}

      {!data.program ? (
        <Card className="tl-card">
          <Empty description="Anda belum terdaftar di program. Coba 1 tryout SKD gratis atau pilih paket.">
            <Space wrap>
              <Button type="primary" onClick={() => navigate('/paket')}>
                Coba Gratis
              </Button>
              <Button onClick={() => navigate('/bank-soal/skd-cpns')}>Latihan Bank Soal</Button>
            </Space>
          </Empty>
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={6}>
              <StatCard
                label="TO selesai"
                value={`${completed.length}${tryoutLimit ? ` / ${tryoutLimit}` : ''}`}
                icon={<CalendarOutlined />}
                color={chartPalette[0]}
                hint={tryoutLimit ? <Progress percent={Math.round((completed.length / tryoutLimit) * 100)} size="small" showInfo={false} /> : undefined}
              />
            </Col>
            <Col xs={12} lg={6}>
              <StatCard
                label="Skor terakhir"
                value={latest ? latest.total_score : '-'}
                icon={<RiseOutlined />}
                color={chartPalette[1]}
                delta={delta}
                deltaLabel="dibanding TO sebelumnya"
                hint={latest ? (latest.passed_all ? 'Memenuhi passing grade' : 'Belum memenuhi passing grade') : 'Belum ada TO selesai'}
              />
            </Col>
            <Col xs={12} lg={6}>
              <StatCard
                label="Peringkat terakhir"
                value={latest?.rank ? `#${latest.rank}` : '-'}
                icon={<TrophyOutlined />}
                color={chartPalette[2]}
                hint={latest?.participants ? `dari ${latest.participants} peserta` : undefined}
              />
            </Col>
            <Col xs={12} lg={6}>
              <StatCard
                label="Subtes terlemah"
                value={latest?.weakest_subtest ? latest.weakest_subtest.toUpperCase() : '-'}
                icon={<FireOutlined />}
                color={chartPalette[3]}
                hint="Fokus latihan berikutnya"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={15}>
              <ChartCard title="Tren skor per TO" option={trendOption} height={320} empty={completed.length === 0} emptyText="Selesaikan TO pertama untuk melihat tren skor." />
            </Col>
            <Col xs={24} lg={9}>
              <ChartCard title="Skor vs passing grade" option={radarOption} height={320} empty={!latest} emptyText="Belum ada skor." />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card className="tl-card" title="Tryout menunggu" style={{ height: '100%' }}>
                <List
                  locale={{ emptyText: 'Tidak ada tryout yang menunggu dikerjakan.' }}
                  dataSource={pendingTryouts.slice(0, 4)}
                  renderItem={(tryout) => (
                    <List.Item actions={[<Button key="go" size="small" type="primary" onClick={() => navigate('/tryout')}>Kerjakan</Button>]}>
                      <List.Item.Meta title={tryout.title} description={`Tutup ${dayjs(tryout.end_time).format('DD MMM HH:mm')}`} />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="tl-card" title="Kelas terdekat" style={{ height: '100%' }}>
                <List
                  locale={{ emptyText: data.program.class_count > 0 ? 'Belum ada jadwal kelas.' : 'Paket Anda belum termasuk kelas live.' }}
                  dataSource={upcomingClasses}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<VideoCameraOutlined style={{ fontSize: 18, color: brand.primary }} />}
                        title={
                          <Space size={6} wrap>
                            {item.title}
                            {item.status === 'LIVE' && <Tag color="red">Live</Tag>}
                          </Space>
                        }
                        description={`${dayjs(item.starts_at).format('ddd, DD MMM HH:mm')} WIB${item.tutor_name ? ` · ${item.tutor_name}` : ''}`}
                      />
                    </List.Item>
                  )}
                />
                {upcomingClasses.length > 0 && (
                  <Button block onClick={() => navigate(`/program-saya?program=${data.program!.program_id}`)}>
                    Semua kelas
                  </Button>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="tl-card" title="Sesi mentoring" style={{ height: '100%' }}>
                {data.program.mentoring_sessions > 0 ? (
                  <List
                    locale={{ emptyText: 'Belum ada sesi dipesan.' }}
                    dataSource={data.mentoring}
                    renderItem={(slot) => (
                      <List.Item>
                        <List.Item.Meta title={`${dayjs(slot.starts_at).format('ddd, DD MMM HH:mm')} WIB`} description={`Bersama ${slot.tutor_name}`} />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">Mentoring 1:1 tersedia di paket Platinum.</Text>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default ParticipantDashboard;
