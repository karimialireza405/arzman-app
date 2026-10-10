/**
 * What a fired price alert says, and how it reaches the user.
 *
 * `Alert.alert` is a no-op on react-native-web, and the web build is what runs
 * on an iPhone home screen, so alerts are shown by an in-app banner on every
 * platform and, on the web, additionally through the browser Notification API
 * once the user has granted permission. Both only work while the app is open.
 */
import { names, formatNumber, type PriceAlert } from "@arzman/shared";

export const ALERT_TITLE = "هشدار ارز من";

export interface AlertNotice {
  id: number;
  title: string;
  lines: string[];
}

export function alertLine(a: PriceAlert, persian = true): string {
  const n = (v: number) => formatNumber(v, persian);
  const name = names[a.currency];
  if (a.kind === "above")
    return `${name} بالاتر از ${n(a.threshold)} تومان رفت`;
  if (a.kind === "below")
    return `${name} پایین‌تر از ${n(a.threshold)} تومان آمد`;
  if (a.kind === "percent")
    return `${name} بیش از ${n(a.threshold)}٪ در روز تغییر کرد`;
  return `${name} در ۵ دقیقه بیش از ${n(a.threshold)}٪ جابه‌جا شد`;
}

export function makeNotice(
  alerts: PriceAlert[],
  id: number,
  persian = true,
): AlertNotice {
  return { id, title: ALERT_TITLE, lines: alerts.map((a) => alertLine(a, persian)) };
}

type BrowserNotification = {
  permission: NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
  new (title: string, options?: NotificationOptions): unknown;
};

function browserApi(): BrowserNotification | null {
  const api = (globalThis as { Notification?: BrowserNotification }).Notification;
  return typeof api === "function" || typeof api === "object" ? (api ?? null) : null;
}

/** "unsupported" outside browsers and on iOS Safari tabs not added to the home screen. */
export function browserPermission(): NotificationPermission | "unsupported" {
  return browserApi()?.permission ?? "unsupported";
}

export async function requestBrowserPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  const api = browserApi();
  if (!api) return "unsupported";
  try {
    return await api.requestPermission();
  } catch {
    return api.permission;
  }
}

export function notifyBrowser(notice: AlertNotice): void {
  const api = browserApi();
  if (!api || api.permission !== "granted") return;
  try {
    new api(notice.title, { body: notice.lines.join("\n"), lang: "fa", dir: "rtl" });
  } catch {
    // Some mobile browsers only allow notifications through a service worker.
  }
}
