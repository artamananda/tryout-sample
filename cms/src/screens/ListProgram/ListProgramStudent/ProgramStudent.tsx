import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Col, Input, Row, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { TableProps } from "antd";
import { CrownOutlined, DownloadOutlined, GiftOutlined, TeamOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { Excel } from "antd-table-saveas-excel";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import useFetchList from "../../../hooks/useFetchList";
import PageHeader from "../../../components/kit/PageHeader";
import StatCard from "../../../components/kit/StatCard";
import UserName from "../../../components/kit/UserName";
import { PACKAGE_COLORS } from "../../../components/kit/UserBadges";
import { apiGetPrograms } from "../../../api/programOps";
import { apiGetProgramPackages } from "../../../api/package";
import type { PackageProps } from "../../../types/package.type";

const { Text, Paragraph } = Typography;

type Member = {
  user_program_id: string;
  user_id: string;
  user: {
    user_id: string;
    name: string;
    username: string;
    email: string;
    phone_number?: string;
    picture_url?: string;
    school?: string;
    regency?: string;
    province?: string;
    last_education?: string;
    major?: string;
    target_agency?: string;
  };
  package_id?: string | null;
  motivation?: string;
  created_at: string;
};

const domicile = (member: Member) => [member.user.regency, member.user.province].filter(Boolean).join(", ");

/** Participants registered to one program, with their package and background. */
const ListProgramStudentScreen = () => {
  const { programId = "" } = useParams();
  const { data, isLoading, setSearch } = useFetchList<Member>({
    endpoint: "transaction-program",
    initialQuery: { program_id: programId },
  });
  const [programName, setProgramName] = useState("");
  const [packages, setPackages] = useState<PackageProps[]>([]);
  const [packageFilter, setPackageFilter] = useState<string>("");

  useEffect(() => {
    apiGetPrograms()
      .then((programs) => setProgramName(programs.find((program) => program.program_id === programId)?.name || ""))
      .catch(() => undefined);
    apiGetProgramPackages(programId).then(setPackages).catch(() => setPackages([]));
  }, [programId]);

  const packageById = useMemo(() => new Map(packages.map((pkg) => [pkg.package_id, pkg])), [packages]);
  const isPaid = (member: Member) => (packageById.get(member.package_id || "")?.price || 0) > 0;

  const members = useMemo(
    () =>
      (data || []).filter((member) =>
        !packageFilter ? true : packageFilter === "none" ? !member.package_id : member.package_id === packageFilter,
      ),
    [data, packageFilter],
  );

  const weekAgo = dayjs().subtract(7, "day");
  const stats = {
    total: data?.length || 0,
    paid: (data || []).filter(isPaid).length,
    free: (data || []).filter((member) => member.package_id && !isPaid(member)).length,
    newThisWeek: (data || []).filter((member) => dayjs(member.created_at).isAfter(weekAgo)).length,
  };

  const packageTag = (member: Member) => {
    const pkg = packageById.get(member.package_id || "");
    if (!pkg) return <Text type="secondary">-</Text>;
    return (
      <Tag color={pkg.price > 0 ? PACKAGE_COLORS[pkg.code] || "blue" : "default"} style={{ margin: 0 }}>
        {pkg.name}
      </Tag>
    );
  };

  const columns: TableProps<Member>["columns"] = [
    {
      title: "Peserta",
      key: "name",
      width: 300,
      render: (_, member) => (
        <Space size={12}>
          <Avatar size={40} src={member.user.picture_url || undefined} icon={<UserOutlined />} style={{ background: "#2563eb", flex: "none" }} />
          <div style={{ minWidth: 0, maxWidth: 230 }}>
            <UserName userId={member.user_id} name={member.user.name} showPackage={false} />
            <Text type="secondary" style={{ display: "block", fontSize: 12 }} ellipsis>
              {member.user.email}
            </Text>
          </div>
        </Space>
      ),
    },
    { title: "Paket", key: "package", width: 130, render: (_, member) => packageTag(member) },
    {
      title: "WhatsApp",
      key: "phone",
      width: 160,
      render: (_, member) =>
        member.user.phone_number ? (
          <Typography.Link href={`https://wa.me/${member.user.phone_number}`} target="_blank" rel="noreferrer">
            {member.user.phone_number}
          </Typography.Link>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Domisili",
      key: "domicile",
      width: 220,
      ellipsis: true,
      render: (_, member) => domicile(member) || <Text type="secondary">-</Text>,
    },
    {
      title: "Pendidikan",
      key: "education",
      width: 200,
      ellipsis: true,
      render: (_, member) =>
        member.user.last_education
          ? `${member.user.last_education}${member.user.major ? ` - ${member.user.major}` : ""}`
          : member.user.school || <Text type="secondary">-</Text>,
    },
    {
      title: "Target Instansi",
      key: "target",
      width: 200,
      ellipsis: true,
      render: (_, member) => member.user.target_agency || <Text type="secondary">-</Text>,
    },
    {
      title: "Motivasi",
      key: "motivation",
      width: 280,
      render: (_, member) =>
        member.motivation ? (
          <Tooltip title={member.motivation}>
            <Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2 }}>
              {member.motivation}
            </Paragraph>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Terdaftar",
      key: "created_at",
      width: 160,
      sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
      defaultSortOrder: "descend",
      render: (_, member) => dayjs(member.created_at).locale("id").format("D MMM YYYY HH:mm"),
    },
  ];

  const exportExcel = () => {
    new Excel()
      .addSheet("peserta")
      .addColumns([
        { title: "Nama", dataIndex: "name" },
        { title: "Email", dataIndex: "email" },
        { title: "WhatsApp", dataIndex: "phone" },
        { title: "Paket", dataIndex: "package" },
        { title: "Domisili", dataIndex: "domicile" },
        { title: "Pendidikan", dataIndex: "education" },
        { title: "Target Instansi", dataIndex: "target" },
        { title: "Motivasi", dataIndex: "motivation" },
        { title: "Terdaftar", dataIndex: "created_at" },
      ])
      .addDataSource(
        members.map((member) => ({
          name: member.user.name,
          email: member.user.email,
          phone: member.user.phone_number || "",
          package: packageById.get(member.package_id || "")?.name || "",
          domicile: domicile(member),
          education: [member.user.last_education, member.user.major].filter(Boolean).join(" - "),
          target: member.user.target_agency || "",
          motivation: member.motivation || "",
          created_at: dayjs(member.created_at).format("YYYY-MM-DD HH:mm"),
        })),
      )
      .saveAs(`peserta_${programName || programId}.xlsx`);
  };

  return (
    <div className="tl-page">
      <PageHeader
        back={-1}
        title="Calon Siswa TELISIK"
        subtitle={programName ? `Peserta terdaftar di ${programName}` : "Peserta terdaftar di program ini"}
        extra={
          <Button icon={<DownloadOutlined />} disabled={!members.length} onClick={exportExcel}>
            Ekspor Excel
          </Button>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <StatCard label="Total peserta" value={stats.total.toLocaleString("id-ID")} icon={<TeamOutlined />} color="#2563eb" loading={isLoading} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard label="Paket berbayar" value={stats.paid.toLocaleString("id-ID")} icon={<CrownOutlined />} color="#d97706" loading={isLoading} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard label="Paket gratis" value={stats.free.toLocaleString("id-ID")} icon={<GiftOutlined />} color="#16a34a" loading={isLoading} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard label="Daftar 7 hari terakhir" value={stats.newThisWeek.toLocaleString("id-ID")} icon={<UserAddOutlined />} color="#7c3aed" loading={isLoading} />
        </Col>
      </Row>

      <Card className="tl-card" bodyStyle={{ padding: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 16 }}>
          <Input.Search
            placeholder="Cari nama"
            allowClear
            onSearch={setSearch}
            style={{ flex: "1 1 260px", maxWidth: 360 }}
          />
          <Select
            style={{ width: 200 }}
            value={packageFilter}
            onChange={setPackageFilter}
            options={[
              { value: "", label: "Semua paket" },
              ...packages.map((pkg) => ({ value: pkg.package_id, label: pkg.name })),
              { value: "none", label: "Belum punya paket" },
            ]}
          />
        </div>
        <Table
          rowKey="user_program_id"
          columns={columns}
          dataSource={members}
          loading={isLoading}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => `${total} peserta` }}
        />
      </Card>
    </div>
  );
};

export default ListProgramStudentScreen;
