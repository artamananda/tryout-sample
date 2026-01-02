import React, { useEffect } from "react";
import { Card, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import AIChatView from "../../components/AIChat/AIChatView";

const { Title } = Typography;

const AIChatScreen = () => {
  useEffect(() => {
    document.title = "AI Generator - CMS";
  }, []);

  return (
    <div
      style={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>
          <RobotOutlined style={{ marginRight: 12, color: "#8C59F1" }} />
          AI Generator
        </Title>
      </div>
      <Card
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        bodyStyle={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 24,
          overflow: "hidden",
        }}
      >
        <AIChatView />
      </Card>
    </div>
  );
};

export default AIChatScreen;
