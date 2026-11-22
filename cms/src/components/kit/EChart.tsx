import { CSSProperties } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, GaugeChart, HeatmapChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { chartPalette, fontFamily } from '../../theme/theme';

// Only the chart types we use are bundled.
echarts.use([
  BarChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer
]);

echarts.registerTheme('telisik', {
  color: chartPalette,
  backgroundColor: 'transparent',
  textStyle: { fontFamily },
  tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.92)', borderWidth: 0, textStyle: { color: '#fff' } },
  categoryAxis: { axisLine: { lineStyle: { color: '#cbd5e1' } }, axisTick: { show: false }, axisLabel: { color: '#64748b' } },
  valueAxis: { axisLine: { show: false }, splitLine: { lineStyle: { color: '#eef2f7' } }, axisLabel: { color: '#64748b' } },
  legend: { textStyle: { color: '#475569' } }
});

type Props = {
  option: EChartsOption;
  height?: number | string;
  style?: CSSProperties;
};

/** ECharts with the TELISIK theme; resizes with its container. */
const EChart = ({ option, height = 300, style }: Props) => (
  <ReactEChartsCore
    echarts={echarts}
    option={option}
    theme="telisik"
    notMerge
    lazyUpdate
    style={{ height, width: '100%', ...style }}
    opts={{ renderer: 'canvas' }}
  />
);

export default EChart;
