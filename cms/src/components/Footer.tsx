const FooterCopyright = () => {
  const currentYear = new Date().getFullYear();
  const version = import.meta.env.VITE_VERSION_NAME;
  return (
    <div>
      © {currentYear} {import.meta.env.VITE_WEBSITE_NAME}
      {version ? ` · v${version}` : ''}
    </div>
  );
};

export default FooterCopyright;
