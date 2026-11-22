import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { EChartsOption } from "echarts";
import dayjs from "dayjs";
import { httpRequest } from "../../helpers/api";
import { getErrorMessage } from "../../helpers/errorHandler";
import PageHeader from "../../components/kit/PageHeader";
import StatCard from "../../components/kit/StatCard";
import ChartCard from "../../components/kit/ChartCard";
import { brand, chartPalette } from "../../theme/theme";
import { formatRupiah } from "../../types/package.type";

const { Text } = Typography;

type Count = { label: string; count: number; revenue?: number };
type KPI = { value: number; previous?: number };
type Analytics = {
  from: string;
  to: string;
  days: number;
  kpis: Record<string, KPI>;
  daily: { date: string; revenue: number; orders: number; users: number }[];
  orders_by_status: Count[];
  revenue_by_package: Count[];
  payment_methods: Count[];
  funnel: Count[];
  provinces: Count[];
  education: Count[];
  gender: Count[];
  orders_heatmap: { weekday: number; hour: number; count: number }[];
  tryouts: {
    tryout_id: string;
    title: string;
    sequence: number;
    participants: number;
    avg_twk: number;
    avg_tiu: number;
    avg_tkp: number;
    avg_total: number;
    pass_rate: number;
  }[];
  score_distribution: Count[];
  subtest_pass_rates: Count[];
  classes: { sequence: number; title: string; starts_at: string; entitled: number; attendees: number; rating_avg: number; rating_count: number }[];
  mentoring: Count[];
  referrals: Record<string, number>;
  generated_at: string;
};

const PERIODS = [
  { label: "7 hari", value: 7 },
  { label: "30 hari", value: 30 },
  { label: "90 hari", value: 90 },
  { label: "1 tahun", value: 365 },
];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const STATUS_LABEL: Record<string, string> = {
  PAID: "Lunas",
  PENDING: "Menunggu",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
  FAILED: "Gagal",
  OPEN: "Tersedia",
  BOOKED: "Dipesan",
  DONE: "Selesai",
  NO_SHOW: "Tidak hadir",
};
const STATUS_COLOR: Record<string, string> = {
  PAID: brand.success,
  PENDING: brand.warning,
  EXPIRED: "#94a3b8",
  CANCELLED: "#cbd5e1",
  FAILED: brand.error,
  OPEN: chartPalette[5],
  BOOKED: chartPalette[2],
  DONE: brand.success,
  NO_SHOW: brand.error,
};

/** Rp 1,2 jt style for axes and tiles. */
const compactRupiah = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (Math.abs(value) >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (Math.abs(value) >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
};

const deltaOf = (kpi?: KPI) => {
  if (!kpi || kpi.previous === undefined || kpi.previous === null || kpi.previous === 0) return null;
  return ((kpi.value - kpi.previous) / kpi.previous) * 100;
};

const AnalyticsDashboard = () => {
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    httpRequest
      .get("/program")
      .then((res) => setPrograms(res.data?.payload?.results || []))
      .catch(() => setPrograms([]));
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const query = new URLSearchParams({ days: String(days) });
      if (programId) query.append("program_id", programId);
      const res = await httpRequest.get(`/admin/analytics?${query.toString()}`);
      setData(res.data?.payload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [days, programId]);

  useEffect(() => {
    load();
  }, [load]);

  const kpi = (name: string) => data?.kpis?.[name];
  const hasProgram = Boolean(programId);

  // ---------------------------------------------------------------- options

  const trendOption = useMemo<EChartsOption>(() => {
    const daily = data?.daily || [];
    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => (typeof value === "number" ? value.toLocaleString("id-ID") : String(value)),
      },
      legend: { top: 0 },
      grid: { left: 56, right: 40, top: 40, bottom: 30 },
      xAxis: { type: "category", data: daily.map((d) => dayjs(d.date).format("DD MMM")) },
      yAxis: [
        { type: "value", name: "Pendapatan", axisLabel: { formatter: (v: number) => compactRupiah(v) } },
        { type: "value", name: "Pesanan", minInterval: 1, splitLine: { show: false } },
      ],
      series: [
        {
          name: "Pendapatan",
          type: "bar",
          data: daily.map((d) => d.revenue),
          barMaxWidth: 22,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: chartPalette[0] },
                { offset: 1, color: "#93c5fd" },
              ],
            },
          },
        },
        {
          name: "Pesanan lunas",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 6,
          data: daily.map((d) => d.orders),
          itemStyle: { color: chartPalette[3] },
          lineStyle: { width: 3 },
        },
      ],
    };
  }, [data]);

  const packageOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "item", formatter: (p: any) => `${p.name}<br/>${formatRupiah(p.value)} (${p.percent}%)` },
      legend: { bottom: 0, type: "scroll" },
      series: [
        {
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "44%"],
          itemStyle: { borderColor: "#fff", borderWidth: 3, borderRadius: 8 },
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: "bold", formatter: "{b}\n{d}%" } },
          data: (data?.revenue_by_package || []).map((p) => ({ name: p.label, value: p.revenue || 0 })),
        },
      ],
    }),
    [data]
  );

  const funnelOption = useMemo<EChartsOption>(() => {
    const funnel = data?.funnel || [];
    const top = funnel[0]?.count || 1;
    return {
      tooltip: { trigger: "item", formatter: (p: any) => `${p.name}<br/>${p.value} orang (${Math.round((p.value / top) * 100)}%)` },
      series: [
        {
          type: "funnel",
          left: "6%",
          width: "88%",
          top: 10,
          bottom: 10,
          sort: "none",
          gap: 3,
          minSize: "34%",
          label: { show: true, position: "inside", formatter: "{b}: {c}", color: "#fff", fontWeight: 600 },
          itemStyle: { borderColor: "#fff", borderWidth: 1 },
          data: funnel.map((f, i) => ({ name: f.label, value: f.count, itemStyle: { color: chartPalette[i % chartPalette.length] } })),
        },
      ],
    };
  }, [data]);

  const usersOption = useMemo<EChartsOption>(() => {
    const daily = data?.daily || [];
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 36, right: 16, top: 16, bottom: 28 },
      xAxis: { type: "category", boundaryGap: false, data: daily.map((d) => dayjs(d.date).format("DD MMM")) },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "Akun baru",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: daily.map((d) => d.users),
          lineStyle: { width: 3, color: chartPalette[4] },
          itemStyle: { color: chartPalette[4] },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(124, 58, 237, 0.35)" },
                { offset: 1, color: "rgba(124, 58, 237, 0.02)" },
              ],
            },
          },
        },
      ],
    };
  }, [data]);

  const statusOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          type: "pie",
          roseType: "radius",
          radius: ["18%", "70%"],
          center: ["50%", "44%"],
          itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
          label: { formatter: "{c}" },
          data: (data?.orders_by_status || []).map((s) => ({
            name: STATUS_LABEL[s.label] || s.label,
            value: s.count,
            itemStyle: { color: STATUS_COLOR[s.label] },
          })),
        },
      ],
    }),
    [data]
  );

  const heatmapOption = useMemo<EChartsOption>(() => {
    const cells = data?.orders_heatmap || [];
    const max = Math.max(1, ...cells.map((c) => c.count));
    return {
      tooltip: {
        position: "top",
        formatter: (p: any) => `${WEEKDAYS[p.value[1]]}, ${String(p.value[0]).padStart(2, "0")}.00 WIB<br/>${p.value[2]} pesanan`,
      },
      grid: { left: 44, right: 16, top: 10, bottom: 78 },
      xAxis: { type: "category", data: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")), splitArea: { show: true } },
      yAxis: { type: "category", data: WEEKDAYS, splitArea: { show: true } },
      visualMap: {
        min: 0,
        max,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemHeight: 140,
        itemWidth: 12,
        text: ["Banyak", "Sedikit"],
        inRange: { color: ["#eff6ff", "#93c5fd", "#2563eb", "#7c3aed", "#db2777"] },
      },
      series: [
        {
          type: "heatmap",
          data: cells.map((c) => [c.hour, c.weekday, c.count]),
          itemStyle: { borderColor: "#fff", borderWidth: 2, borderRadius: 4 },
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.25)" } },
        },
      ],
    };
  }, [data]);

  const methodsOption = useMemo<EChartsOption>(() => {
    const methods = [...(data?.payment_methods || [])].reverse();
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 90, right: 24, top: 10, bottom: 24 },
      xAxis: { type: "value", minInterval: 1 },
      yAxis: { type: "category", data: methods.map((m) => m.label || "-") },
      series: [
        {
          name: "Pesanan",
          type: "bar",
          data: methods.map((m, i) => ({ value: m.count, itemStyle: { color: chartPalette[(i + 5) % chartPalette.length] } })),
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: "right" },
        },
      ],
    };
  }, [data]);

  const skdOption = useMemo<EChartsOption>(() => {
    const tryouts = data?.tryouts || [];
    return {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 44, right: 44, top: 40, bottom: 28 },
      xAxis: { type: "category", data: tryouts.map((t) => (t.sequence ? `TO ${t.sequence}` : t.title)) },
      yAxis: [
        { type: "value", name: "Rata-rata" },
        { type: "value", name: "Lulus %", max: 100, splitLine: { show: false } },
      ],
      series: [
        { name: "TWK", type: "bar", stack: "skd", data: tryouts.map((t) => t.avg_twk), itemStyle: { color: chartPalette[0] }, barMaxWidth: 34 },
        { name: "TIU", type: "bar", stack: "skd", data: tryouts.map((t) => t.avg_tiu), itemStyle: { color: chartPalette[7] } },
        { name: "TKP", type: "bar", stack: "skd", data: tryouts.map((t) => t.avg_tkp), itemStyle: { color: chartPalette[2], borderRadius: [6, 6, 0, 0] } },
        {
          name: "Lulus passing grade",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 8,
          data: tryouts.map((t) => t.pass_rate),
          itemStyle: { color: chartPalette[3] },
          lineStyle: { width: 3 },
        },
      ],
    };
  }, [data]);

  const distributionOption = useMemo<EChartsOption>(() => {
    const buckets = data?.score_distribution || [];
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 36, right: 12, top: 16, bottom: 44 },
      xAxis: { type: "category", data: buckets.map((b) => b.label), axisLabel: { rotate: 40, fontSize: 10 } },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "Peserta",
          type: "bar",
          barCategoryGap: "8%",
          data: buckets.map((b, i) => ({
            value: b.count,
            // Cooler colors for low scores, warmer for high scores.
            itemStyle: { color: ["#94a3b8", "#94a3b8", "#60a5fa", "#60a5fa", "#38bdf8", "#14b8a6", "#22c55e", "#84cc16", "#f59e0b", "#f97316", "#db2777"][i] },
          })),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [data]);

  const gaugeOption = useMemo<EChartsOption>(() => {
    const rates = data?.subtest_pass_rates || [];
    const colors = [chartPalette[0], chartPalette[7], chartPalette[2]];
    return {
      series: rates.map((rate, i) => ({
        type: "gauge",
        center: [`${18 + i * 32}%`, "58%"],
        radius: "42%",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        progress: { show: true, width: 10, roundCap: true, itemStyle: { color: colors[i] } },
        axisLine: { lineStyle: { width: 10, color: [[1, "#eef2f7"]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        title: { offsetCenter: [0, "62%"], fontSize: 13, fontWeight: 700, color: "#475569" },
        detail: { valueAnimation: true, offsetCenter: [0, "0%"], fontSize: 20, fontWeight: 800, formatter: "{value}%", color: colors[i] },
        data: [{ value: rate.count, name: rate.label.toUpperCase() }],
      })),
    };
  }, [data]);

  const provinceOption = useMemo<EChartsOption>(() => {
    const provinces = [...(data?.provinces || [])].reverse();
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 130, right: 28, top: 8, bottom: 20 },
      xAxis: { type: "value", minInterval: 1 },
      yAxis: { type: "category", data: provinces.map((p) => p.label), axisLabel: { width: 120, overflow: "truncate" } },
      series: [
        {
          name: "Peserta",
          type: "bar",
          barMaxWidth: 16,
          label: { show: true, position: "right" },
          data: provinces.map((p, i) => ({ value: p.count, itemStyle: { color: chartPalette[i % chartPalette.length], borderRadius: [0, 6, 6, 0] } })),
        },
      ],
    };
  }, [data]);

  const pieOption = (rows: Count[], offset: number): EChartsOption => ({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll" },
    series: [
      {
        type: "pie",
        radius: ["40%", "68%"],
        center: ["50%", "42%"],
        itemStyle: { borderColor: "#fff", borderWidth: 2, borderRadius: 6 },
        label: { show: false },
        data: rows.map((row, i) => ({ name: row.label, value: row.count, itemStyle: { color: chartPalette[(i + offset) % chartPalette.length] } })),
      },
    ],
  });

  const classOption = useMemo<EChartsOption>(() => {
    const classes = data?.classes || [];
    return {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 40, right: 40, top: 40, bottom: 28 },
      xAxis: { type: "category", data: classes.map((c) => `Kelas ${c.sequence}`) },
      yAxis: [
        { type: "value", name: "Peserta", minInterval: 1 },
        { type: "value", name: "Rating", min: 0, max: 5, splitLine: { show: false } },
      ],
      series: [
        { name: "Berhak ikut", type: "bar", data: classes.map((c) => c.entitled), itemStyle: { color: "#c7d2fe", borderRadius: [6, 6, 0, 0] }, barMaxWidth: 26 },
        { name: "Hadir", type: "bar", data: classes.map((c) => c.attendees), itemStyle: { color: chartPalette[4], borderRadius: [6, 6, 0, 0] }, barMaxWidth: 26 },
        {
          name: "Rating",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 8,
          connectNulls: true,
          data: classes.map((c) => (c.rating_count ? c.rating_avg : null)),
          itemStyle: { color: chartPalette[2] },
          lineStyle: { width: 3 },
        },
      ],
    };
  }, [data]);

  const mentoringOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          type: "pie",
          radius: ["44%", "70%"],
          center: ["50%", "42%"],
          itemStyle: { borderColor: "#fff", borderWidth: 2, borderRadius: 6 },
          label: { formatter: "{c}" },
          data: (data?.mentoring || []).map((m) => ({ name: STATUS_LABEL[m.label] || m.label, value: m.count, itemStyle: { color: STATUS_COLOR[m.label] } })),
        },
      ],
    }),
    [data]
  );

  // ---------------------------------------------------------------- render

  const sum = (rows?: Count[], key: "count" | "revenue" = "count") => (rows || []).reduce((total, row) => total + (row[key] || 0), 0);
  const dailyRevenue = (data?.daily || []).reduce((total, day) => total + day.revenue, 0);
  const dailyUsers = (data?.daily || []).reduce((total, day) => total + day.users, 0);
  const rangeText = data ? `${dayjs(data.from).format("DD MMM YYYY")} – ${dayjs(data.to).format("DD MMM YYYY")}` : "";

  return (
    <div className="tl-page">
      <PageHeader
        title="Dashboard"
        subtitle={rangeText ? `Ringkasan bisnis & belajar · ${rangeText}` : "Ringkasan bisnis & belajar"}
        extra={
          <>
            <Select
              value={programId}
              onChange={setProgramId}
              style={{ minWidth: 220 }}
              options={[{ value: "", label: "Semua program" }, ...programs.map((p) => ({ value: p.program_id, label: p.name }))]}
            />
            <Segmented value={days} onChange={(value) => setDays(Number(value))} options={PERIODS} />
            <Tooltip title={data ? `Diperbarui ${dayjs(data.generated_at).format("HH:mm:ss")}` : ""}>
              <Button icon={<ReloadOutlined />} onClick={load} loading={isLoading} aria-label="Muat ulang" />
            </Tooltip>
          </>
        }
      />

      {error && <Alert type="error" showIcon message="Dashboard gagal dimuat" description={error} />}

      <Row gutter={[16, 16]}>
        {[
          { key: "revenue", label: "Pendapatan", icon: <DollarOutlined />, color: chartPalette[0], format: (v: number) => formatRupiah(v), delta: true },
          { key: "paid_orders", label: "Pesanan lunas", icon: <ShoppingCartOutlined />, color: chartPalette[1], format: (v: number) => v.toLocaleString("id-ID"), delta: true },
          { key: "avg_order_value", label: "Rata-rata nilai pesanan", icon: <WalletOutlined />, color: chartPalette[2], format: (v: number) => formatRupiah(Math.round(v)), delta: true },
          { key: "new_users", label: "Akun baru", icon: <UserAddOutlined />, color: chartPalette[4], format: (v: number) => v.toLocaleString("id-ID"), delta: true },
          { key: "participants", label: "Peserta program", icon: <TeamOutlined />, color: chartPalette[5], format: (v: number) => v.toLocaleString("id-ID") },
          { key: "pending_orders", label: "Menunggu pembayaran", icon: <ClockCircleOutlined />, color: chartPalette[8], format: (v: number) => v.toLocaleString("id-ID") },
          { key: "avg_skd_score", label: "Rata-rata skor SKD", icon: <TrophyOutlined />, color: chartPalette[3], format: (v: number) => v.toLocaleString("id-ID") },
          { key: "pass_rate", label: "Lulus passing grade", icon: <CheckCircleOutlined />, color: chartPalette[7], format: (v: number) => `${v.toLocaleString("id-ID")}%` },
          ...(hasProgram
            ? [
                { key: "attendance_rate", label: "Kehadiran kelas", icon: <CalendarOutlined />, color: chartPalette[6], format: (v: number) => `${v.toLocaleString("id-ID")}%` },
                { key: "avg_class_rating", label: "Rating kelas", icon: <StarOutlined />, color: chartPalette[9], format: (v: number) => `${v.toLocaleString("id-ID")} / 5` },
              ]
            : []),
        ].map((item) => {
          const value = kpi(item.key);
          return (
            <Col key={item.key} xs={12} md={8} xl={6} xxl={hasProgram ? 4 : 6}>
              <StatCard
                loading={isLoading && !data}
                label={item.label}
                value={value ? item.format(value.value) : "-"}
                icon={item.icon}
                color={item.color}
                delta={item.delta ? deltaOf(value) : undefined}
                deltaLabel={`vs ${days} hari sebelumnya`}
              />
            </Col>
          );
        })}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <ChartCard title="Pendapatan & pesanan harian" option={trendOption} height={320} loading={isLoading && !data} empty={dailyRevenue === 0} emptyText="Belum ada pesanan lunas di periode ini." />
        </Col>
        <Col xs={24} xl={8}>
          <ChartCard title="Pendapatan per paket" option={packageOption} height={320} loading={isLoading && !data} empty={sum(data?.revenue_by_package, "revenue") === 0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12} xl={8}>
          <ChartCard title="Funnel konversi" extra={<Text type="secondary">sepanjang waktu</Text>} option={funnelOption} height={300} loading={isLoading && !data} empty={!data?.funnel?.[0]?.count} />
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <ChartCard title="Akun baru per hari" option={usersOption} height={300} loading={isLoading && !data} empty={dailyUsers === 0} />
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <ChartCard title="Status pesanan" option={statusOption} height={300} loading={isLoading && !data} empty={sum(data?.orders_by_status) === 0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <ChartCard title="Waktu pemesanan (hari × jam WIB)" option={heatmapOption} height={320} loading={isLoading && !data} empty={(data?.orders_heatmap || []).length === 0} emptyText="Belum ada pesanan di periode ini." />
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <ChartCard title="Metode pembayaran" option={methodsOption} height={300} loading={isLoading && !data} empty={sum(data?.payment_methods) === 0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <ChartCard title="Rata-rata skor SKD per TO" option={skdOption} height={320} loading={isLoading && !data} empty={(data?.tryouts || []).every((t) => t.participants === 0)} emptyText="Belum ada peserta yang menyelesaikan TO SKD." />
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <ChartCard title="Distribusi skor total" option={distributionOption} height={320} loading={isLoading && !data} empty={sum(data?.score_distribution) === 0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12} xl={8}>
          <ChartCard title="Lulus passing grade per subtes" option={gaugeOption} height={240} loading={isLoading && !data} empty={sum(data?.score_distribution) === 0} />
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <ChartCard title="Sebaran provinsi" option={provinceOption} height={240} loading={isLoading && !data} empty={sum(data?.provinces) === 0} />
        </Col>
        <Col xs={12} xl={4}>
          <ChartCard title="Pendidikan" option={pieOption(data?.education || [], 4)} height={240} loading={isLoading && !data} empty={sum(data?.education) === 0} />
        </Col>
        <Col xs={12} xl={4}>
          <ChartCard title="Gender" option={pieOption(data?.gender || [], 3)} height={240} loading={isLoading && !data} empty={sum(data?.gender) === 0} />
        </Col>
      </Row>

      {hasProgram && (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <ChartCard title="Kehadiran & rating kelas live" option={classOption} height={300} loading={isLoading && !data} empty={(data?.classes || []).length === 0} emptyText="Belum ada jadwal kelas di program ini." />
          </Col>
          <Col xs={24} xl={8}>
            <ChartCard title="Slot mentoring" option={mentoringOption} height={300} loading={isLoading && !data} empty={sum(data?.mentoring) === 0} emptyText="Belum ada slot mentoring." />
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="tl-card" title="Ringkasan TO SKD" bodyStyle={{ padding: 0 }}>
            <Table
              rowKey="tryout_id"
              size="middle"
              pagination={false}
              scroll={{ x: true }}
              loading={isLoading && !data}
              dataSource={data?.tryouts || []}
              locale={{ emptyText: "Belum ada TO SKD." }}
              columns={[
                { title: "TO", render: (_, t) => <Text strong>{t.title}</Text> },
                { title: "Peserta", dataIndex: "participants", align: "right" },
                { title: "TWK", dataIndex: "avg_twk", align: "right" },
                { title: "TIU", dataIndex: "avg_tiu", align: "right" },
                { title: "TKP", dataIndex: "avg_tkp", align: "right" },
                { title: "Total", render: (_, t) => <Text strong>{t.avg_total}</Text>, align: "right" },
                {
                  title: "Lulus PG",
                  align: "right",
                  render: (_, t) => <Tag color={t.pass_rate >= 50 ? "green" : t.pass_rate > 0 ? "gold" : "default"}>{t.pass_rate}%</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="tl-card" title="Program rujukan" style={{ height: "100%" }}>
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              {[
                { label: "Pesanan lunas lewat rujukan", value: (data?.referrals?.paid_orders || 0).toLocaleString("id-ID"), color: chartPalette[1] },
                { label: "Total potongan diberikan", value: formatRupiah(data?.referrals?.discount_total || 0), color: chartPalette[6] },
                { label: "Bonus TO diberikan", value: (data?.referrals?.bonus_tryouts || 0).toLocaleString("id-ID"), color: chartPalette[4] },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <Space>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: row.color, display: "inline-block" }} />
                    <Text>{row.label}</Text>
                  </Space>
                  <Text strong style={{ fontSize: 16 }}>
                    {row.value}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;
