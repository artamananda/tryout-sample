import { Suspense, useEffect, useMemo, useState } from "react";
import {
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  RobotOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Modal, Spin } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthUser, useSignOut } from "react-auth-kit";
import logoWordmark from "../../assets/logo-wordmark.png";
import logoIcon from "../../assets/logo-icon.png";
import FooterCopyright from "../../components/Footer";
import UserName from "../../components/kit/UserName";

const { Content, Header, Sider } = Layout;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>["items"][number];

/** Header title and active menu key, matched by path prefix (longest wins). */
const SECTIONS: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/orders", "Pesanan Paket"],
  ["/guarantee-claims", "Garansi Naik Kelas"],
  ["/weekly-report", "Email Mingguan"],
  ["/program", "Program"],
  ["/tryout-result", "Tryout Result"],
  ["/tryout-score", "Tryout Result"],
  ["/tryout", "Tryout"],
  ["/bank-soal/utbk", "Bank Soal UTBK"],
  ["/bank-soal/skd-cpns", "Bank Soal SKD CPNS"],
  ["/ai-generator", "AI Generator"],
  ["/learning-video", "Learning Video"],
  ["/ebook", "Ebook"],
  ["/role/admins", "Admin"],
  ["/role/users", "User"],
  ["/settings/llm-config", "LLM Config"],
];

function sectionFor(pathname: string): [string, string] | undefined {
  // SKD ranking lives under /tryout/:id but belongs to results.
  if (/^\/tryout\/[^/]+\/skd-ranking/.test(pathname)) return ["/tryout-result", "Ranking SKD"];
  return SECTIONS.filter(([prefix]) => pathname.startsWith(prefix)).sort((a, b) => b[0].length - a[0].length)[0];
}

const AppLayout = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = useSignOut();
  const authUser = useAuthUser();
  const user = authUser();

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const items: MenuItem[] = useMemo(
    () => [
      {
        type: "group",
        label: "Ringkasan",
        children: [{ key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" }],
      },
      {
        type: "group",
        label: "Program & Penjualan",
        children: [
          { key: "/program", icon: <ScheduleOutlined />, label: "Program" },
          { key: "/orders", icon: <ShoppingOutlined />, label: "Pesanan Paket" },
          { key: "/guarantee-claims", icon: <SafetyOutlined />, label: "Garansi Naik Kelas" },
          { key: "/weekly-report", icon: <MailOutlined />, label: "Email Mingguan" },
        ],
      },
      {
        type: "group",
        label: "Konten",
        children: [
          { key: "/tryout", icon: <CalendarOutlined />, label: "Tryout" },
          { key: "/tryout-result", icon: <BarChartOutlined />, label: "Tryout Result" },
          {
            key: "bank-soal",
            icon: <BookOutlined />,
            label: "Bank Soal",
            children: [
              { key: "/bank-soal/utbk", label: "UTBK" },
              { key: "/bank-soal/skd-cpns", label: "SKD CPNS" },
            ],
          },
          { key: "/ai-generator", icon: <RobotOutlined />, label: "AI Generator" },
          { key: "/learning-video", icon: <PlayCircleOutlined />, label: "Learning Video" },
          { key: "/ebook", icon: <ReadOutlined />, label: "Ebook" },
        ],
      },
      {
        type: "group",
        label: "Pengguna & Sistem",
        children: [
          {
            key: "role",
            icon: <TeamOutlined />,
            label: "Pengguna",
            children: [
              { key: "/role/admins", label: "Admin" },
              { key: "/role/users", label: "Peserta" },
            ],
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Pengaturan",
            children: [{ key: "/settings/llm-config", label: "LLM Config" }],
          },
        ],
      },
    ],
    []
  );

  const section = sectionFor(location.pathname);
  const selectedKey = section?.[0] || "";
  const defaultOpen = ["bank-soal", "role", "settings"].filter((key) =>
    location.pathname.startsWith(key === "bank-soal" ? "/bank-soal" : key === "role" ? "/role" : "/settings")
  );

  const confirmLogout = () =>
    Modal.confirm({
      title: "Keluar dari CMS?",
      okText: "Keluar",
      cancelText: "Batal",
      onOk: () => {
        signOut();
        navigate("/login");
      },
    });

  const menu = (
    <div className="tl-sider-menu">
      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={defaultOpen}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  );

  const brand = (
    <div className={`tl-brand${!isMobile && collapsed ? " is-collapsed" : ""}`}>
      {!isMobile && collapsed ? (
        <img src={logoIcon} alt="TELISIK" className="tl-brand-icon" />
      ) : (
        <>
          <img src={logoWordmark} alt="TELISIK - Teras Belajar Asik" className="tl-brand-wordmark" />
          <span className="tl-brand-tag">CMS</span>
        </>
      )}
    </div>
  );

  return (
    <Layout className={`tl-shell${collapsed && !isMobile ? " is-collapsed" : ""}`}>
      {!isMobile && (
        <Sider className="tl-sider" width={256} collapsedWidth={76} collapsed={collapsed} trigger={null}>
          {brand}
          {menu}
          {!collapsed && (
            <div className="tl-sider-footer">
              <FooterCopyright />
            </div>
          )}
        </Sider>
      )}

      <Drawer
        className="tl-mobile-drawer"
        placement="left"
        width={272}
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={false}
      >
        {brand}
        {menu}
        <div className="tl-sider-footer">
          <FooterCopyright />
        </div>
      </Drawer>

      <Layout className="tl-main">
        <Header className="tl-header">
          <Button
            type="text"
            aria-label="Buka menu"
            icon={isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed((value) => !value))}
          />
          <div className="tl-header-title">{section?.[1] || ""}</div>
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{ items: [{ key: "logout", icon: <LogoutOutlined />, label: "Keluar", danger: true, onClick: confirmLogout }] }}
          >
            <div className="tl-header-user" role="button" tabIndex={0}>
              <Avatar src={user?.picture_url || undefined} icon={<UserOutlined />} style={{ background: "#2563eb" }} />
              <div className="tl-header-user-text">
                <strong className="tl-header-user-line">
                  <UserName userId={user?.user_id} name={user?.name || "Admin"} showPackage={false} strong={false} />
                </strong>
                <span>{user?.email || ""}</span>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content className="tl-content">
          <Suspense
            fallback={
              <div style={{ textAlign: "center", padding: 48 }}>
                <Spin />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
