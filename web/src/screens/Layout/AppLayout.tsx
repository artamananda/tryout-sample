import React, { Suspense, useState } from 'react';
import {
  CalendarOutlined,
  UserOutlined,
  PoweroffOutlined,
  ScheduleOutlined,
  BookOutlined,
  PlayCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Image, Spin, Modal, Button, Grid } from 'antd';
import logo from '../../assets/logo-yellow.png';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser, useIsAuthenticated, useSignOut } from 'react-auth-kit';
import FooterCopyright from '../../components/Footer';
import './AppLayout.css';

const { Content, Header, Sider } = Layout;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label
  } as MenuItem;
}

const AppLayout = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = useSignOut();
  const isAuthenticated = useIsAuthenticated();
  const userAuth = useAuthUser();
  const loggedIn = isAuthenticated();
  const name = loggedIn && userAuth() ? userAuth()?.name : 'Pengunjung';

  const items: MenuItem[] = loggedIn
    ? [
        getItem(name, '/user', <UserOutlined />, [
          getItem('Keluar', '/logout', <PoweroffOutlined />)
        ]),
        getItem('Tryout', '/tryout', <CalendarOutlined />),
        getItem('Bank Soal', '/bank-soal', <BookOutlined />, [
          getItem('Bank Soal UTBK', '/bank-soal/utbk'),
          getItem('Bank Soal SKD CPNS', '/bank-soal/skd-cpns'),
        ]),
        getItem('Learning Video', '/learning-video', <PlayCircleOutlined />),
        getItem('Program', '/program', <ScheduleOutlined />)
      ]
    : [
        getItem('Bank Soal', '/bank-soal', <BookOutlined />, [
          getItem('Bank Soal UTBK', '/bank-soal/utbk'),
          getItem('Bank Soal SKD CPNS', '/bank-soal/skd-cpns'),
        ]),
        getItem('Masuk', '/login', <UserOutlined />),
        getItem('Daftar', '/register', <CalendarOutlined />)
      ];

  const selectedKey = location.pathname.startsWith('/bank-soal/utbk')
    ? '/bank-soal/utbk'
    : location.pathname.startsWith('/bank-soal/skd-cpns')
    ? '/bank-soal/skd-cpns'
    : items?.find(
        (item) =>
          typeof item?.key === 'string' && location.pathname.startsWith(item.key)
      )?.key || '/bank-soal/utbk';

  const handleMenuClick = (key: string) => {
    if (key === '/logout') {
      Modal.confirm({
        title: 'Konfirmasi Keluar',
        content: 'Apakah Anda yakin ingin keluar dari akun?',
        okText: 'Ya',
        cancelText: 'Tidak',
        onOk: () => {
          signOut();
          navigate('/login');
        }
      });
      return;
    }

    navigate(key);
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const generatePathName = (path: string) => {
    path = path.replace(/^\//, '');
    return path
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Layout className="app-shell">
      <Sider
        className="app-sidebar"
        trigger={null}
        width={268}
        collapsedWidth={isMobile ? 0 : 80}
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        <div className={`app-sidebar-brand ${collapsed ? 'is-collapsed' : ''}`}>
          {collapsed ? (
            <Image
              src={logo}
              alt="Logo"
              preview={false}
              style={{ maxHeight: 30 }}
            />
          ) : (
            <Image
              src={logo}
              alt="Logo"
              preview={false}
              style={{ maxHeight: 42 }}
            />
          )}
        </div>

        <Menu
          className="app-sidebar-menu"
          theme="dark"
          selectedKeys={[String(selectedKey)]}
          mode="inline"
          items={items}
          onClick={({ key }) => handleMenuClick(key)}
        />

        {!collapsed && (
          <div className="app-sidebar-version">
            <FooterCopyright />
          </div>
        )}
      </Sider>

      <Layout className="app-main-layout">
        <Header className="app-topbar">
          <Button
            className="app-menu-toggle"
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Toggle navigation menu"
          />
          <div className="app-topbar-title">
            {generatePathName(location.pathname)}
          </div>
        </Header>

        <Content className="app-main-content">
          <Suspense fallback={<Spin spinning={true} />}>
            <div className="app-content-card">
              <Outlet />
            </div>
          </Suspense>
          {/* <div className="app-main-footer">
            <FooterCopyright />
          </div> */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
