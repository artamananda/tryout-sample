import React, { useState } from "react";
import {
  CalendarOutlined,
  UserOutlined,
  PoweroffOutlined,
  UsergroupAddOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, theme, Image } from "antd";
import logo from "../../assets/logo-yellow.png";
import ListTryout from "../Tryout/ListTryout";

const { Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

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
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("User", "user", <UserOutlined />, [
    getItem("Logout", "logout", <PoweroffOutlined />),
  ]),
  getItem("Tryout", "tryout", <CalendarOutlined />),
  getItem("Tryout Result", "result", <BarChartOutlined />),
  getItem("Role", "role", <UsergroupAddOutlined />, [
    getItem("Admin", "admin"),
    getItem("Student", "student"),
  ]),
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        // collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <Image src={logo} width={150} style={{ margin: 20 }} preview={false} />
        <Menu
          theme="dark"
          defaultSelectedKeys={["tryout"]}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: "0 16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <ListTryout />
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Telisik Tryout ©2024 Created by Artamananda
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
