import React, { Suspense, useState } from 'react';
import {
  CalendarOutlined,
  UserOutlined,
  PoweroffOutlined,
  ScheduleOutlined,
  BookOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Image, Spin, Modal } from 'antd';
import logo from '../../assets/logo-yellow.png';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthUser, useIsAuthenticated, useSignOut } from 'react-auth-kit';
import FooterCopyright from '../../components/Footer';

const { Content, Footer, Sider } = Layout;

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
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
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
        getItem('Bank Soal', '/bank-soal', <BookOutlined />),
        getItem('Learning Video', '/learning-video', <PlayCircleOutlined />),
        getItem('Program', '/program', <ScheduleOutlined />)
      ]
    : [
        getItem('Bank Soal', '/bank-soal', <BookOutlined />),
        getItem('Masuk', '/login', <UserOutlined />),
        getItem('Daftar', '/register', <CalendarOutlined />)
      ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        {collapsed ? (
          <div
            style={{
              height: 32,
              margin: 16,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Image
              src={logo}
              alt="Logo"
              preview={false}
              style={{ maxHeight: 32 }}
            />
          </div>
        ) : (
          <div
            style={{
              height: 64,
              margin: 16,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Image
              src={logo}
              alt="Logo"
              preview={false}
              style={{ maxHeight: 150 }}
            />
          </div>
        )}
        <Menu
          theme="dark"
          defaultSelectedKeys={['tryout']}
          mode="inline"
          items={items}
          onClick={({ key }) => {
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
            } else {
              navigate(key);
            }
          }}
        />
        <div
          style={{
            color: '#fff',
            position: 'absolute',
            textAlign: 'center',
            bottom: 60,
            left: 0,
            right: 0,
            fontSize: 10
          }}
        >{`${import.meta.env.VITE_WEBSITE_NAME} v${import.meta.env.VITE_VERSION_NAME}`}</div>
      </Sider>
      <Layout>
        <Content style={{ margin: 20 }}>
          <Suspense fallback={<Spin spinning={true} />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
