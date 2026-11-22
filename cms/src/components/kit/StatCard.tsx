import { ReactNode } from 'react';
import { Card, Skeleton, Tooltip } from 'antd';

type Props = {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  /** Accent color of the icon tile. */
  color?: string;
  hint?: ReactNode;
  /** Change vs previous period in percent; null/undefined hides it. */
  delta?: number | null;
  deltaLabel?: string;
  loading?: boolean;
};

const hexToTint = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** KPI tile: icon, label, big value and an optional change indicator. */
const StatCard = ({ label, value, icon, color = '#2563eb', hint, delta, deltaLabel = 'vs periode sebelumnya', loading }: Props) => {
  const direction = delta === undefined || delta === null ? null : delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : 'is-flat';
  return (
    <Card className="tl-card" style={{ height: '100%' }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <div className="tl-stat">
          {icon && (
            <div className="tl-stat-icon" style={{ background: hexToTint(color, 0.12), color }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="tl-stat-label">{label}</div>
            <div className="tl-stat-value">{value}</div>
            {direction && (
              <Tooltip title={deltaLabel}>
                <span className={`tl-stat-delta ${direction}`}>
                  {delta! > 0 ? '▲' : delta! < 0 ? '▼' : '•'} {Math.abs(delta!).toFixed(delta! % 1 === 0 ? 0 : 1)}%
                </span>
              </Tooltip>
            )}
            {hint && <div style={{ fontSize: 12, color: 'var(--tl-muted)', marginTop: 2 }}>{hint}</div>}
          </div>
        </div>
      )}
    </Card>
  );
};

export default StatCard;
