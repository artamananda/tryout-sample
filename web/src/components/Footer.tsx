const FooterCopyright = () => {
  return (
    <div>
      {`Copyright © 2024 ${process.env.REACT_APP_WEBSITE_NAME} v${process.env.REACT_APP_VERSION_NAME} All rights reserved`}
    </div>
  );
};

export default FooterCopyright;
