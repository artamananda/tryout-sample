const FooterCopyright = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div>
      {`Copyright © ${currentYear} ${import.meta.env.VITE_WEBSITE_NAME} v${import.meta.env.VITE_VERSION_NAME} All rights reserved`}
    </div>
  );
};

export default FooterCopyright;
