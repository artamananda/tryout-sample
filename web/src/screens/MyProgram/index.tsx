import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  List,
  message,
  Modal,
  Rate,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import type { TableProps } from 'antd';
import {
  CopyOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  bookMentoring,
  cancelMentoring,
  claimGuarantee,
  getMentoring,
  getMyLiveClasses,
  getMyPrograms,
  getProgramProgress,
  getRecording,
  getReferral,
  issueCertificate,
  joinLiveClass,
  rateLiveClass
} from '../../api/myProgram';
import { getErrorMessage } from '../../helpers/errorMessage';
import {
  LiveClassProps,
  MentoringOverviewProps,
  MyProgramProps,
  ProgramProgressProps,
  ReferralInfoProps,
  TryoutProgressProps
} from '../../types/myProgram.type';
import { formatRupiah } from '../../types/package.type';

const { Title, Text, Paragraph } = Typography;

const formatDate = (value: string) => dayjs(value).format('ddd, DD MMM YYYY HH:mm');

// ---------------------------------------------------------------- progress

const ProgressTab = ({ programId, onOpenCertificate }: { programId: string; onOpenCertificate: (number: string) => void }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgramProgressProps>();
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    getProgramProgress(programId)
      .then(setProgress)
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [programId]);

  useEffect(load, [load]);

  const claim = () =>
    Modal.confirm({
      title: 'Ajukan garansi naik kelas?',
      content: 'Tim TELISIK akan memeriksa klaim dan mendaftarkan Anda ke siklus kelas berikutnya tanpa biaya.',
      okText: 'Ajukan',
      onOk: async () => {
        try {
          await claimGuarantee(programId);
          message.success('Klaim garansi terkirim');
          load();
        } catch (err) {
          message.error(getErrorMessage(err));
        }
      }
    });

  const certificate = async () => {
    try {
      setIsWorking(true);
      const result = await issueCertificate(programId);
      onOpenCertificate(result.certificate_number);
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading || !progress) {
    return <Spin />;
  }

  const columns: TableProps<TryoutProgressProps>['columns'] = [
    { title: 'TO', dataIndex: 'title' },
    {
      title: 'Skor (TWK/TIU/TKP)',
      render: (_, row) =>
        row.completed ? `${row.scores?.twk ?? 0} / ${row.scores?.tiu ?? 0} / ${row.scores?.tkp ?? 0}` : <Text type="secondary">-</Text>
    },
    {
      title: 'Total',
      render: (_, row) =>
        row.completed ? (
          <Space>
            <Text strong>{row.total_score}</Text>
            <Tag color={row.passed_all ? 'green' : 'red'}>{row.passed_all ? 'Lulus PG' : 'Belum'}</Tag>
          </Space>
        ) : (
          <Tag>{dayjs().isBefore(dayjs(row.start_time)) ? `Dibuka ${dayjs(row.start_time).format('DD MMM')}` : 'Belum dikerjakan'}</Tag>
        )
    },
    { title: 'Peringkat', render: (_, row) => (row.completed ? `${row.rank} / ${row.participants}` : '-') },
    {
      title: '',
      render: (_, row) =>
        row.completed ? (
          <Button size="small" onClick={() => navigate(`/tryout/${row.tryout_id}/hasil-skd`)}>
            Detail
          </Button>
        ) : null
    }
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Text>
        Paket <b>{progress.package_name || 'Program'}</b> · {progress.completed_count} TO selesai
      </Text>
      <Table rowKey="tryout_id" columns={columns} dataSource={progress.tryouts} pagination={false} scroll={{ x: true }} />

      {progress.study_group_url && (
        <Alert
          type="success"
          showIcon
          icon={<TeamOutlined />}
          message="Grup belajar"
          description="Gabung ke grup belajar peserta paket Anda."
          action={
            <Button type="primary" href={progress.study_group_url} target="_blank" rel="noreferrer">
              Gabung Grup
            </Button>
          }
        />
      )}

      {progress.guarantee?.included && (
        <Card size="small" title="Garansi naik kelas">
          <Paragraph style={{ marginBottom: 8 }}>{progress.guarantee.reason}</Paragraph>
          {progress.guarantee.claim_status ? (
            <Tag color={progress.guarantee.claim_status === 'APPROVED' ? 'green' : progress.guarantee.claim_status === 'REJECTED' ? 'red' : 'gold'}>
              Klaim {progress.guarantee.claim_status}
            </Tag>
          ) : (
            <Button disabled={!progress.guarantee.eligible} onClick={claim}>
              Ajukan Garansi
            </Button>
          )}
        </Card>
      )}

      {progress.certificate?.included && (
        <Card size="small" title="Sertifikat">
          {progress.certificate.certificate_number ? (
            <Button icon={<SafetyCertificateOutlined />} onClick={() => onOpenCertificate(progress.certificate!.certificate_number!)}>
              Lihat Sertifikat
            </Button>
          ) : (
            <Space direction="vertical">
              {progress.certificate.reason && <Text type="secondary">{progress.certificate.reason}</Text>}
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                disabled={!progress.certificate.eligible}
                loading={isWorking}
                onClick={certificate}
              >
                Terbitkan Sertifikat
              </Button>
            </Space>
          )}
        </Card>
      )}
    </Space>
  );
};

// ---------------------------------------------------------------- classes

const ClassesTab = ({ programId }: { programId: string }) => {
  const [classes, setClasses] = useState<LiveClassProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState<{ cls?: LiveClassProps; value: number; comment: string }>({ value: 5, comment: '' });

  const load = useCallback(() => {
    setIsLoading(true);
    getMyLiveClasses(programId)
      .then(setClasses)
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [programId]);

  useEffect(load, [load]);

  const open = async (action: () => Promise<string>) => {
    // Open the tab first so pop-up blockers allow it, then point it at the link.
    const tab = window.open('', '_blank');
    try {
      const url = await action();
      if (tab) tab.location.href = url;
      else window.location.assign(url);
      load();
    } catch (err) {
      tab?.close();
      message.error(getErrorMessage(err));
    }
  };

  const submitRating = async () => {
    if (!rating.cls) return;
    try {
      await rateLiveClass(rating.cls.class_id, rating.value, rating.comment);
      message.success('Terima kasih atas penilaiannya');
      setRating({ value: 5, comment: '' });
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  if (isLoading) return <Spin />;
  if (classes.length === 0) return <Empty description="Belum ada jadwal kelas." />;

  return (
    <>
      <List
        dataSource={classes}
        renderItem={(cls) => (
          <Card size="small" style={{ marginBottom: 12, opacity: cls.has_access ? 1 : 0.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <Text strong>
                  Kelas {cls.sequence}: {cls.title}
                </Text>
                <br />
                <Text type="secondary">
                  {formatDate(cls.starts_at)} – {dayjs(cls.ends_at).format('HH:mm')} WIB
                  {cls.tutor_name && ` · ${cls.tutor_name}`}
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color={cls.status === 'LIVE' ? 'red' : cls.status === 'UPCOMING' ? 'blue' : 'default'}>
                    {cls.status === 'LIVE' ? 'Sedang berlangsung' : cls.status === 'UPCOMING' ? 'Akan datang' : 'Selesai'}
                  </Tag>
                  {cls.attended && <Tag color="green">Hadir</Tag>}
                  {cls.my_rating ? <Tag>Rating Anda: {cls.my_rating}</Tag> : null}
                </div>
                {!cls.has_access && <Text type="warning">{cls.locked_reason}</Text>}
                {cls.has_access && cls.status === 'UPCOMING' && !cls.can_join && (
                  <Text type="secondary">Link dibuka {formatDate(cls.join_opens_at)}</Text>
                )}
                {cls.has_recording && cls.recording_expires_at && (
                  <Text type="secondary" style={{ display: 'block' }}>
                    Rekaman tersedia sampai {formatDate(cls.recording_expires_at)}
                  </Text>
                )}
              </div>
              <Space wrap>
                {cls.can_join && (
                  <Button type="primary" icon={<VideoCameraOutlined />} onClick={() => open(() => joinLiveClass(cls.class_id))}>
                    Gabung Kelas
                  </Button>
                )}
                {cls.has_recording && (
                  <Button icon={<PlayCircleOutlined />} onClick={() => open(() => getRecording(cls.class_id))}>
                    Rekaman
                  </Button>
                )}
                {cls.can_rate && (
                  <Button onClick={() => setRating({ cls, value: cls.my_rating || 5, comment: '' })}>
                    {cls.my_rating ? 'Ubah Rating' : 'Beri Rating'}
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        )}
      />
      <Modal
        open={Boolean(rating.cls)}
        title={`Nilai ${rating.cls?.title || 'kelas'}`}
        okText="Kirim"
        onOk={submitRating}
        onCancel={() => setRating({ value: 5, comment: '' })}
      >
        <Rate value={rating.value} onChange={(value) => setRating((prev) => ({ ...prev, value }))} />
        <Input.TextArea
          style={{ marginTop: 12 }}
          rows={3}
          maxLength={1000}
          placeholder="Masukan untuk tutor (opsional)"
          value={rating.comment}
          onChange={(event) => setRating((prev) => ({ ...prev, comment: event.target.value }))}
        />
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------- mentoring

const MentoringTab = ({ programId }: { programId: string }) => {
  const [overview, setOverview] = useState<MentoringOverviewProps>();
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    getMentoring(programId)
      .then(setOverview)
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [programId]);

  useEffect(load, [load]);

  const act = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      message.success(done);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  if (isLoading || !overview) return <Spin />;
  if (overview.allowed === 0) {
    return <Empty description="Paket Anda belum termasuk mentoring 1:1." />;
  }

  const mine = overview.slots.filter((slot) => slot.is_mine);
  const open = overview.slots.filter((slot) => !slot.is_mine && slot.status === 'OPEN');
  const byDay = open.reduce<Record<string, typeof open>>((acc, slot) => {
    const day = dayjs(slot.starts_at).format('dddd, DD MMMM YYYY');
    (acc[day] = acc[day] || []).push(slot);
    return acc;
  }, {});

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={`Jatah mentoring: ${overview.used} dari ${overview.allowed} terpakai`}
        description="Booking ditutup 2 jam sebelum sesi. Pembatalan bisa sampai 24 jam sebelum sesi."
      />
      {mine.length > 0 && (
        <Card size="small" title="Sesi Anda">
          {mine.map((slot) => (
            <div key={slot.slot_id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <div>
                <Text strong>{formatDate(slot.starts_at)} WIB</Text> · {slot.tutor_name} · {slot.duration_minutes} menit{' '}
                <Tag>{slot.status}</Tag>
              </div>
              <Space>
                {slot.meeting_url && slot.status === 'BOOKED' && (
                  <Button type="primary" href={slot.meeting_url} target="_blank" rel="noreferrer">
                    Link Sesi
                  </Button>
                )}
                {slot.can_cancel && (
                  <Button danger onClick={() => act(() => cancelMentoring(slot.slot_id), 'Booking dibatalkan')}>
                    Batalkan
                  </Button>
                )}
              </Space>
            </div>
          ))}
        </Card>
      )}
      {overview.remaining > 0 &&
        (Object.keys(byDay).length === 0 ? (
          <Empty description="Belum ada slot tersedia." />
        ) : (
          Object.entries(byDay).map(([day, slots]) => (
            <Card size="small" title={day} key={day}>
              <Space wrap>
                {slots.map((slot) => (
                  <Button
                    key={slot.slot_id}
                    onClick={() =>
                      Modal.confirm({
                        title: 'Pesan sesi mentoring?',
                        content: `${formatDate(slot.starts_at)} WIB bersama ${slot.tutor_name}`,
                        okText: 'Pesan',
                        onOk: () => act(() => bookMentoring(slot.slot_id), 'Sesi mentoring dipesan')
                      })
                    }
                  >
                    {dayjs(slot.starts_at).format('HH:mm')} · {slot.tutor_name}
                  </Button>
                ))}
              </Space>
            </Card>
          ))
        ))}
    </Space>
  );
};

// ---------------------------------------------------------------- referral

const ReferralTab = () => {
  const [info, setInfo] = useState<ReferralInfoProps>();

  useEffect(() => {
    getReferral()
      .then(setInfo)
      .catch((err) => message.error(getErrorMessage(err)));
  }, []);

  if (!info) return <Spin />;
  const link = `${window.location.origin}/paket?ref=${info.code}`;
  const copy = (text: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('Disalin'))
      .catch(() => message.info(text));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Paragraph>
        Ajak teman ikut TELISIK. Teman mendapat potongan <b>{formatRupiah(info.discount_amount)}</b> untuk paket berbayar
        pertamanya, dan Anda mendapat <b>{info.bonus_tryouts_per_referral} TO tambahan</b> untuk setiap teman yang membayar.
      </Paragraph>
      <Space.Compact style={{ width: '100%', maxWidth: 520 }}>
        <Input readOnly value={info.code} style={{ fontWeight: 700, letterSpacing: 2 }} />
        <Button icon={<CopyOutlined />} onClick={() => copy(info.code)}>
          Salin Kode
        </Button>
      </Space.Compact>
      <Space.Compact style={{ width: '100%', maxWidth: 520 }}>
        <Input readOnly value={link} />
        <Button icon={<CopyOutlined />} onClick={() => copy(link)}>
          Salin Link
        </Button>
      </Space.Compact>
      <Text>
        {info.paid_referrals} teman sudah membayar · {info.bonus_tryouts_earned} TO tambahan didapat
      </Text>
    </Space>
  );
};

// ---------------------------------------------------------------- page

const MyProgramScreen = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [programs, setPrograms] = useState<MyProgramProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyPrograms()
      .then(setPrograms)
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedId = searchParams.get('program') || programs[0]?.program_id;
  const selected = useMemo(() => programs.find((program) => program.program_id === selectedId), [programs, selectedId]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!selected) {
    return (
      <Empty description="Anda belum terdaftar di program apa pun.">
        <Button type="primary" onClick={() => navigate('/paket')}>
          Lihat Paket
        </Button>
      </Empty>
    );
  }

  const tabs = [
    {
      key: 'progress',
      label: 'Progres',
      children: <ProgressTab programId={selected.program_id} onOpenCertificate={(number) => navigate(`/sertifikat/${number}`)} />
    },
    ...(selected.class_count > 0 || !selected.package_code
      ? [{ key: 'classes', label: 'Kelas Live', children: <ClassesTab programId={selected.program_id} /> }]
      : []),
    ...(selected.mentoring_sessions > 0
      ? [{ key: 'mentoring', label: 'Mentoring 1:1', children: <MentoringTab programId={selected.program_id} /> }]
      : []),
    { key: 'referral', label: 'Ajak Teman', children: <ReferralTab /> }
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          {selected.program_name}
        </Title>
        <Space wrap>
          {programs.length > 1 && (
            <Select
              value={selected.program_id}
              style={{ minWidth: 220 }}
              onChange={(value) => setSearchParams({ program: value })}
              options={programs.map((program) => ({ value: program.program_id, label: program.program_name }))}
            />
          )}
          {selected.package_name && <Tag color="blue">Paket {selected.package_name}</Tag>}
          <Button onClick={() => navigate(`/program/${selected.program_id}/paket`)}>Tingkatkan Paket</Button>
        </Space>
      </div>
      <Card style={{ marginTop: 16 }}>
        <Tabs items={tabs} destroyInactiveTabPane />
      </Card>
    </div>
  );
};

export default MyProgramScreen;
