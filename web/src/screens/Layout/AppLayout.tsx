import React, { Suspense, useState } from 'react';
import {
  CalendarOutlined,
  UserOutlined,
  PoweroffOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Image, Spin, Modal } from 'antd';
import logo from '../../assets/logo-yellow.png';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthUser, useSignOut } from 'react-auth-kit';
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
  const userAuth = useAuthUser();
  const name = userAuth() ? userAuth()?.name : 'User';

  const items: MenuItem[] = [
    getItem(name, '/user', <UserOutlined />, [
      getItem('Logout', '/logout', <PoweroffOutlined />)
    ]),
    getItem('Tryout', '/tryout', <CalendarOutlined />),
    getItem('Program', '/program', <ScheduleOutlined />)
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
                title: 'Confirm Logout',
                content: 'Are you sure you want to logout?',
                okText: 'Yes',
                cancelText: 'No',
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
      </Sider>
      <Layout>
        <Content style={{ margin: 20 }}>
          <Suspense fallback={<Spin spinning={true} />}>
            <Outlet />
          </Suspense>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          <FooterCopyright />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
