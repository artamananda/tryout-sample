import { Typography } from 'antd';

const { Text } = Typography;

const FooterCopyright = () => {
  return (
    <Text>
      {`Copyright © 2024 ${process.env.REACT_APP_WEBSITE_NAME} v${process.env.REACT_APP_VERSION_NAME} All rights reserved`}
    </Text>
  );
};

export default FooterCopyright;
