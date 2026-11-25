import { useEffect } from "react";
import { Card } from "antd";
import AIChatView from "../../components/AIChat/AIChatView";

/** The page title already shows in the app header, so the chat fills the page. */
const AIChatScreen = () => {
  useEffect(() => {
    document.title = "AI Generator - CMS";
  }, []);

  return (
    <Card
      className="tl-card"
      style={{
        height: "calc(100vh - 64px - 2 * var(--tl-gutter))",
        minHeight: 480,
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
  );
};

export default AIChatScreen;
