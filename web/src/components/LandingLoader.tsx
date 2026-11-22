import { Spin } from 'antd';

/** Full-page spinner shown while the landing stylesheets load. */
const LandingLoader = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
    <Spin size="large" />
  </div>
);

export default LandingLoader;
