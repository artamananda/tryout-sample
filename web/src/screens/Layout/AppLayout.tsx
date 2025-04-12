import React, { Suspense, useState } from 'react';
import {
  CalendarOutlined,
  UserOutlined,
  PoweroffOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Image, Spin } from 'antd';
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
    getItem('Tryout', '/tryout', <CalendarOutlined />)
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        // collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <Image src={logo} width={150} style={{ margin: 20 }} preview={false} />
        <Menu
          theme="dark"
          defaultSelectedKeys={['tryout']}
          mode="inline"
          items={items}
          onClick={({ key }) => {
            if (key === '/logout') {
              signOut();
              navigate('/login');
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
