/** 本地登录会话：存在时 getInitialState 不再请求远端 currentUser */

export const MOCK_AUTH_SESSION_KEY = "iot-platform-mock-auth-session";

export const MOCK_CURRENT_USER: API.CurrentUser = {
  name: "系统管理员",
  avatar: "/logo.svg",
  userid: "00000001",
  access: "admin",
  title: "平台管理员",
};

export function isMockSessionActive(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(MOCK_AUTH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMockSessionActive(): void {
  try {
    sessionStorage.setItem(MOCK_AUTH_SESSION_KEY, "1");
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearMockSession(): void {
  try {
    sessionStorage.removeItem(MOCK_AUTH_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
