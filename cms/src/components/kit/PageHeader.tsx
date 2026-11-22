import { ReactNode } from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  /** Path (or -1) for a back button above the title. */
  back?: string | number;
  backLabel?: string;
};

/** Standard page title row: title, optional subtitle and actions on the right. */
const PageHeader = ({ title, subtitle, extra, back, backLabel = 'Kembali' }: Props) => {
  const navigate = useNavigate();
  return (
    <div>
      {back !== undefined && (
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          style={{ paddingInline: 0, marginBottom: 4 }}
          onClick={() => (typeof back === 'number' ? navigate(back) : navigate(back))}
        >
          {backLabel}
        </Button>
      )}
      <div className="tl-page-header">
        <div style={{ minWidth: 0 }}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {extra && <div className="tl-page-header-extra">{extra}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
