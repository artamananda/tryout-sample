import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FileTextOutlined,
  IdcardOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  ScheduleOutlined,
  ShoppingOutlined,
  TrophyOutlined,
  UserAddOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Modal, Spin } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser, useIsAuthenticated, useSignOut } from 'react-auth-kit';
import { VerifiedMark } from '../../components/kit/UserBadges';
import logoWordmark from '../../assets/logo-wordmark.png';
import logoIcon from '../../assets/logo-icon.png';
import FooterCopyright from '../../components/Footer';

const { Content, Header, Sider } = Layout;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];

/** Page titles for the header, matched by path prefix (longest first). */
const PAGE_TITLES: [string, string][] = [
  ['/dashboard', 'Dashboard'],
  ['/program-saya', 'Program Saya'],
  ['/tryout', 'Tryout'],
  ['/bank-soal/utbk', 'Bank Soal UTBK'],
  ['/bank-soal/skd-cpns', 'Bank Soal SKD CPNS'],
  ['/learning-video', 'Learning Video'],
  ['/paket', 'Paket SKD CPNS'],
  ['/pesanan', 'Pesanan Saya'],
  ['/profile', 'Profil Saya'],
  ['/sertifikat', 'Sertifikat'],
  ['/program', 'Program']
];

/** Menu key for the current path; program package pages belong to "Paket". */
function selectedKeyFor(pathname: string) {
  if (/^\/program\/[^/]+\/paket/.test(pathname)) return '/paket';
  const match = PAGE_TITLES.filter(([prefix]) => pathname.startsWith(prefix)).sort((a, b) => b[0].length - a[0].length)[0];
  return match ? match[0] : '';
}

const AppLayout = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = useSignOut();
  const isAuthenticated = useIsAuthenticated();
  const authUser = useAuthUser();
  const loggedIn = isAuthenticated();
  const user = loggedIn ? authUser() : null;

  // Close the mobile menu whenever the page changes.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const items: MenuItem[] = useMemo(
    () =>
      loggedIn
        ? [
            {
              type: 'group',
              label: 'Belajar',
              children: [
                { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                { key: '/program-saya', icon: <TrophyOutlined />, label: 'Program Saya' },
                { key: '/tryout', icon: <CalendarOutlined />, label: 'Tryout' },
                {
                  key: 'bank-soal',
                  icon: <BookOutlined />,
                  label: 'Bank Soal',
                  children: [
                    { key: '/bank-soal/utbk', label: 'UTBK' },
                    { key: '/bank-soal/skd-cpns', label: 'SKD CPNS' }
                  ]
                },
                { key: '/learning-video', icon: <PlayCircleOutlined />, label: 'Learning Video' }
              ]
            },
            {
              type: 'group',
              label: 'Program & Paket',
              children: [
                { key: '/paket', icon: <ShoppingOutlined />, label: 'Paket SKD CPNS' },
                { key: '/pesanan', icon: <FileTextOutlined />, label: 'Pesanan Saya' },
                { key: '/program', icon: <ScheduleOutlined />, label: 'Program' }
              ]
            },
            {
              type: 'group',
              label: 'Akun',
              children: [{ key: '/profile', icon: <IdcardOutlined />, label: 'Profil Saya' }]
            }
          ]
        : [
            {
              type: 'group',
              label: 'Jelajahi',
              children: [
                {
                  key: 'bank-soal',
                  icon: <BookOutlined />,
                  label: 'Bank Soal',
                  children: [
                    { key: '/bank-soal/utbk', label: 'UTBK' },
                    { key: '/bank-soal/skd-cpns', label: 'SKD CPNS' }
                  ]
                },
                { key: '/paket', icon: <ShoppingOutlined />, label: 'Paket SKD CPNS' }
              ]
            },
            {
              type: 'group',
              label: 'Akun',
              children: [
                { key: '/login', icon: <LoginOutlined />, label: 'Masuk' },
                { key: '/register', icon: <UserAddOutlined />, label: 'Daftar' }
              ]
            }
          ],
    [loggedIn]
  );

  const selectedKey = selectedKeyFor(location.pathname);
  const title = PAGE_TITLES.find(([prefix]) => prefix === selectedKey)?.[1] || '';

  const confirmLogout = () =>
    Modal.confirm({
      title: 'Keluar dari akun?',
      content: 'Anda perlu masuk lagi untuk melanjutkan.',
      okText: 'Keluar',
      cancelText: 'Batal',
      onOk: () => {
        signOut();
        navigate('/login');
      }
    });

  const menu = (
    <div className="tl-sider-menu">
      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={location.pathname.startsWith('/bank-soal') ? ['bank-soal'] : []}
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
        </>
      )}
    </div>
  );

  const userMenu: MenuProps['items'] = [
    { key: 'profile', icon: <IdcardOutlined />, label: 'Profil Saya', onClick: () => navigate('/profile') },
    { key: 'orders', icon: <FileTextOutlined />, label: 'Pesanan Saya', onClick: () => navigate('/pesanan') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Keluar', danger: true, onClick: confirmLogout }
  ];

  return (
    <Layout className={`tl-shell${collapsed && !isMobile ? ' is-collapsed' : ''}`}>
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
          <div className="tl-header-title">{title}</div>
          {user ? (
            <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
              <div className="tl-header-user" role="button" tabIndex={0}>
                <Avatar src={user.picture_url || undefined} icon={<UserOutlined />} style={{ background: '#2563eb' }} />
                <div className="tl-header-user-text">
                  <strong className="tl-header-user-line">
                    <em className="tl-header-user-name" title={user.name}>
                      {user.name}
                    </em>
                    <VerifiedMark badges={user.badges} size={15} />
                  </strong>
                  <span>{user.email}</span>
                </div>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login', { state: { from: location } })}>
              Masuk
            </Button>
          )}
        </Header>

        <Content className="tl-content">
          <Suspense
            fallback={
              <div style={{ textAlign: 'center', padding: 48 }}>
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
