import type { ThemeConfig } from 'antd';

/**
 * TELISIK design tokens. The web app and the CMS share the same file so both
 * look like one product. Change colors here, not in components.
 */
export const brand = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  navy: '#0b1f4d',
  navyDeep: '#081638',
  accent: '#f5b301',
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#0ea5e9',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  surface: '#ffffff',
  canvas: '#f4f6fb'
};

/** Categorical palette for charts: distinct, readable on white. */
export const chartPalette = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#db2777',
  '#7c3aed',
  '#0ea5e9',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#84cc16'
];

export const fontFamily =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: brand.primary,
    colorSuccess: brand.success,
    colorWarning: brand.warning,
    colorError: brand.error,
    colorInfo: brand.info,
    colorLink: brand.primary,
    colorTextBase: brand.ink,
    colorBgLayout: brand.canvas,
    colorBorderSecondary: brand.line,
    fontFamily,
    fontSize: 14,
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    controlHeight: 38,
    wireframe: false
  },
  components: {
    Layout: {
      siderBg: brand.navy,
      headerBg: brand.surface,
      bodyBg: brand.canvas,
      headerHeight: 64,
      headerPadding: '0 24px'
    },
    Menu: {
      darkItemBg: brand.navy,
      darkSubMenuItemBg: brand.navyDeep,
      darkItemSelectedBg: brand.primary,
      darkItemColor: 'rgba(226, 232, 240, 0.78)',
      darkItemHoverColor: '#ffffff',
      itemBorderRadius: 10,
      itemMarginInline: 10,
      itemHeight: 42
    },
    Card: {
      paddingLG: 20,
      headerFontSize: 15
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: brand.muted,
      rowHoverBg: '#f8fafc',
      cellPaddingBlock: 12
    },
    Button: {
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none'
    },
    Tabs: {
      titleFontSize: 14
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 26
    },
    Tag: {
      borderRadiusSM: 6
    },
    Modal: {
      titleFontSize: 17
    }
  }
};
