import { Typography } from "antd";
const { Text } = Typography;
const FooterCopyright = () => {
  const currentYear = new Date().getFullYear();
  return (
    <Text>{`Copyright © ${currentYear} ${import.meta.env.VITE_WEBSITE_NAME} v${import.meta.env.VITE_VERSION_NAME} All rights reserved`}</Text>
  );
};

export default FooterCopyright;
