import { describe, expect, it, vi, afterEach } from "vitest";
import type { PriceAlert } from "@arzman/shared";
import {
  alertLine,
  browserPermission,
  makeNotice,
  notifyBrowser,
} from "./alert-notice";

const base: PriceAlert = {
  id: "1",
  currency: "USD",
  kind: "above",
  threshold: 100000,
  enabled: true,
  triggeredAt: null,
};

afterEach(() => vi.unstubAllGlobals());

describe("alert notice", () => {
  it("describes each condition", () => {
    expect(alertLine(base, false)).toContain("بالاتر از 100,000 تومان");
    expect(alertLine({ ...base, kind: "below" }, false)).toContain("پایین‌تر از");
    expect(alertLine({ ...base, kind: "percent", threshold: 2 }, false)).toContain("2٪");
    expect(alertLine({ ...base, kind: "rapid", threshold: 1 }, false)).toContain("۵ دقیقه");
  });

  it("builds one line per alert", () => {
    expect(makeNotice([base, { ...base, id: "2" }], 7).lines).toHaveLength(2);
  });

  it("is unsupported without the Notification API", () => {
    expect(browserPermission()).toBe("unsupported");
    expect(() => notifyBrowser(makeNotice([base], 1))).not.toThrow();
  });

  it("only notifies once permission is granted", () => {
    const ctor = vi.fn();
    vi.stubGlobal("Notification", Object.assign(ctor, { permission: "default" }));
    notifyBrowser(makeNotice([base], 1));
    expect(ctor).not.toHaveBeenCalled();
    vi.stubGlobal("Notification", Object.assign(ctor, { permission: "granted" }));
    notifyBrowser(makeNotice([base], 1));
    expect(ctor).toHaveBeenCalledOnce();
  });
});
