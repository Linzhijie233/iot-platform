/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: "/user",
    layout: false,
    routes: [
      {
        name: "login",
        path: "/user/login",
        component: "./user/login",
      },
    ],
  },
  {
    path: "/data-board",
    name: "data-board",
    icon: "dashboard",
    component: "./dashboard",
  },
  {
    path: "/alert-center",
    name: "alert-center",
    icon: "alert",
    component: "./alert-center",
  },
  {
    path: "/admin",
    name: "admin",
    icon: "setting",
    access: "canAdmin",
    routes: [
      {
        path: "/admin",
        redirect: "/admin/sub-page",
      },
      {
        path: "/admin/sub-page",
        name: "sub-page",
        component: "./Admin",
      },
    ],
  },
  {
    path: "/communication",
    name: "communication",
    icon: "wifi",
    routes: [
      {
        path: "/communication",
        redirect: "/communication/card-identifier-management",
      },
      {
        path: "/communication/card-identifier-management",
        name: "card-identifier-management",
        component: "./communication/card-identifier-management",
      },
      {
        path: "/communication/flow-pool",
        name: "flow-pool",
        component: "./communication/flow-pool",
      },
      {
        path: "/communication/voice-pool",
        name: "voice-pool",
        component: "./communication/voice-pool",
      },
      {
        path: "/communication/package-list",
        name: "package-list",
        component: "./communication/package-list",
      },
      {
        path: "/communication/risk-control-management",
        name: "risk-control-management",
        component: "./communication/risk-control-management",
      },
    ],
  },
  {
    path: "/device",
    name: "device",
    icon: "desktop",
    routes: [
      {
        path: "/device",
        redirect: "/device/device-list",
      },
      {
        path: "/device/device-list",
        name: "device-list",
        component: "./device/device-list",
      },
    ],
  },
  {
    path: "/service",
    name: "service",
    icon: "appstore",
    routes: [
      {
        path: "/service",
        redirect: "/service/service-product",
      },
      {
        path: "/service/service-product",
        name: "service-product",
        component: "./service/service-product",
      },
      {
        path: "/service/service-subscription",
        name: "service-subscription",
        component: "./service/service-subscription",
      },
      {
        path: "/service/service-operations",
        name: "service-operations",
        component: "./service/service-operations",
      },
      {
        path: "/service/service-assurance",
        name: "service-assurance",
        component: "./service/service-assurance",
      },
    ],
  },
  {
    path: "/finance",
    name: "finance",
    icon: "wallet",
    routes: [
      {
        path: "/finance",
        redirect: "/finance/order-settlement",
      },
      {
        path: "/finance/order-settlement",
        name: "order-settlement",
        component: "./finance/order-settlement",
      },
      {
        path: "/finance/commission-management",
        name: "commission-management",
        component: "./finance/commission-management",
      },
      {
        path: "/finance/withdraw-management",
        name: "withdraw-management",
        component: "./finance/withdraw-management",
      },
      {
        path: "/finance/merchant-risk",
        name: "merchant-risk",
        component: "./finance/merchant-risk",
      },
    ],
  },
  {
    path: "/",
    redirect: "/data-board",
  },
  {
    path: "*",
    layout: false,
    component: "./404",
  },
];
