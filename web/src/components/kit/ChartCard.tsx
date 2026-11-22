import { ReactNode } from 'react';
import { Card, Empty, Skeleton } from 'antd';
import type { EChartsOption } from 'echarts';
import EChart from './EChart';

type Props = {
  title: ReactNode;
  extra?: ReactNode;
  option?: EChartsOption;
  height?: number;
  loading?: boolean;
  /** Show "no data" instead of an empty chart. */
  empty?: boolean;
  emptyText?: string;
  children?: ReactNode;
};

/** Card with a title and one chart (or custom content). */
const ChartCard = ({ title, extra, option, height = 300, loading, empty, emptyText = 'Belum ada data', children }: Props) => (
  <Card className="tl-card tl-chart-card" title={title} extra={extra} style={{ height: '100%' }}>
    {loading ? (
      <Skeleton active paragraph={{ rows: 6 }} />
    ) : empty ? (
      <div className="tl-chart-empty" style={{ height }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      </div>
    ) : (
      children || (option && <EChart option={option} height={height} />)
    )}
  </Card>
);

export default ChartCard;
