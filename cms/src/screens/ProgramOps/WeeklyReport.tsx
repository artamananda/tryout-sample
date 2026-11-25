import { useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Input, message, Select, Space, Typography } from "antd";
import { apiGetPrograms, apiGetWeeklySettings, apiRunWeeklyReport, apiSetWeeklySettings } from "../../api/programOps";
import { getErrorMessage } from "../../helpers/errorHandler";

const { Text } = Typography;

const DEFAULT_SUBJECT = "Progres mingguan {program}";

type RunResult = { week_start: string; recipients: number; sent: number; skipped: number; failed: number; dry_run: boolean; errors?: string[] };

const WeeklyReportScreen = () => {
  const [note, setNote] = useState("");
  const [subject, setSubject] = useState("");
  const [defaultSubject, setDefaultSubject] = useState(DEFAULT_SUBJECT);
  const [isSaving, setIsSaving] = useState(false);
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([]);
  const [programId, setProgramId] = useState<string>();
  const [result, setResult] = useState<RunResult>();
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    apiGetWeeklySettings()
      .then((settings) => {
        setNote(settings?.note || "");
        setSubject(settings?.subject || "");
        setDefaultSubject(settings?.default_subject || DEFAULT_SUBJECT);
      })
      .catch(() => undefined);
    apiGetPrograms().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await apiSetWeeklySettings(note, subject);
      message.success("Pengaturan email disimpan");
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const firstProgram = programs[0]?.name || "SKD CPNS Gelombang 1";
  const subjectPreview = (subject.trim() || defaultSubject)
    .replace(/\{nama\}/g, "Budi Santoso")
    .replace(/\{program\}/g, firstProgram);

  const run = async (dryRun: boolean) => {
    try {
      setIsRunning(true);
      setResult(await apiRunWeeklyReport(programId, dryRun));
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <Text type="secondary">
        Terkirim otomatis setiap Minggu pukul 19.00 WIB ke peserta paket dengan email progres (Eksekutif, Platinum). Isi: skor tiap
        TO, tren, peringkat, subtes terlemah, dan jadwal 7 hari ke depan. Satu email per peserta per minggu.
      </Text>

      <Card title="Isi email" style={{ marginTop: 16 }}>
        <Text strong>Subject</Text>
        <Input
          style={{ marginTop: 6 }}
          maxLength={150}
          showCount
          placeholder={defaultSubject}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
          Pakai <code>{"{nama}"}</code> untuk nama peserta dan <code>{"{program}"}</code> untuk nama program. Kosongkan untuk
          memakai bawaan.
        </Text>
        <Alert style={{ marginTop: 8 }} type="info" showIcon message={<>Contoh subject: <b>{subjectPreview}</b></>} />

        <Text strong style={{ display: "block", marginTop: 20 }}>
          Informasi terbaru (ditambahkan ke semua email)
        </Text>
        <Input.TextArea
          style={{ marginTop: 6 }}
          rows={4}
          maxLength={2000}
          showCount
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button type="primary" style={{ marginTop: 12 }} loading={isSaving} onClick={saveSettings}>
          Simpan
        </Button>
      </Card>

      <Card title="Kirim manual" style={{ marginTop: 16 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder="Semua program yang berjalan"
            style={{ minWidth: 260 }}
            value={programId}
            onChange={setProgramId}
            options={programs.map((program) => ({ value: program.program_id, label: program.name }))}
          />
          <Button loading={isRunning} onClick={() => run(true)}>
            Hitung Penerima
          </Button>
          <Button type="primary" danger loading={isRunning} onClick={() => run(false)}>
            Kirim Sekarang
          </Button>
        </Space>
        {result && (
          <Descriptions bordered size="small" column={1} style={{ marginTop: 16 }}>
            <Descriptions.Item label="Minggu mulai">{result.week_start}</Descriptions.Item>
            <Descriptions.Item label="Penerima">{result.recipients}</Descriptions.Item>
            <Descriptions.Item label="Terkirim">{result.dry_run ? "- (hitung saja)" : result.sent}</Descriptions.Item>
            <Descriptions.Item label="Sudah dikirim minggu ini">{result.skipped}</Descriptions.Item>
            <Descriptions.Item label="Gagal">{result.failed}</Descriptions.Item>
          </Descriptions>
        )}
        {result?.errors?.length ? <Alert style={{ marginTop: 12 }} type="error" message={result.errors.slice(0, 5).join("; ")} /> : null}
      </Card>
    </div>
  );
};

export default WeeklyReportScreen;
