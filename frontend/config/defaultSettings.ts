import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  // 品牌蓝（antd5 默认）
  colorPrimary: '#1677ff',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '物联网',
  pwa: true,
  logo: '/logo.svg',
  iconfontUrl: '',
  token: {
    // 通过 token 修改布局样式
  },
};

export default Settings;
