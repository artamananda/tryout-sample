import { useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Input, message, Select, Space, Typography } from "antd";
import { apiGetPrograms, apiGetWeeklyNote, apiRunWeeklyReport, apiSetWeeklyNote } from "../../api/programOps";
import { getErrorMessage } from "../../helpers/errorHandler";

const { Title, Text } = Typography;

type RunResult = { week_start: string; recipients: number; sent: number; skipped: number; failed: number; dry_run: boolean; errors?: string[] };

const WeeklyReportScreen = () => {
  const [note, setNote] = useState("");
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([]);
  const [programId, setProgramId] = useState<string>();
  const [result, setResult] = useState<RunResult>();
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    apiGetWeeklyNote().then((value) => setNote(value || "")).catch(() => undefined);
    apiGetPrograms().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  const saveNote = async () => {
    try {
      await apiSetWeeklyNote(note);
      message.success("Catatan disimpan");
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

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
      <Title level={3}>Email Progres Mingguan</Title>
      <Text type="secondary">
        Terkirim otomatis setiap Minggu pukul 19.00 WIB ke peserta paket dengan email progres (Eksekutif, Platinum). Isi: skor tiap
        TO, tren, peringkat, subtes terlemah, dan jadwal 7 hari ke depan. Satu email per peserta per minggu.
      </Text>

      <Card title="Informasi terbaru (ditambahkan ke semua email)" style={{ marginTop: 16 }}>
        <Input.TextArea rows={4} maxLength={2000} showCount value={note} onChange={(event) => setNote(event.target.value)} />
        <Button type="primary" style={{ marginTop: 12 }} onClick={saveNote}>
          Simpan Catatan
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
