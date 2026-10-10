import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { z } from "zod";
import {
  MarketSnapshotSchema,
  PriceAlertSchema,
  CustomRateSchema,
  CurrencySchema,
  alertMatches,
  isStale,
  observationOf,
  type MarketSnapshot,
  type HistoricalPoint,
} from "@arzman/shared";
import { makeNotice, notifyBrowser, type AlertNotice } from "./alert-notice";
import { readLocal, writeLocal, clearMarketCache } from "./storage";

export const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  "",
);
const SettingsSchema = z.object({
  unit: z.enum(["IRT", "IRR"]),
  persian: z.boolean(),
  haptics: z.boolean(),
  appearance: z.enum(["dark", "light", "system"]),
  refresh: z.union([
    z.literal(30),
    z.literal(60),
    z.literal(120),
    z.literal(300),
  ]),
  // `privacy` (the portfolio's Face ID lock) was removed with the portfolio.
  // Saved settings that still carry it parse fine: z.object strips unknown keys.
});
const UserSchema = z.object({
  settings: SettingsSchema,
  watchlist: z.array(CurrencySchema),
  alerts: z.array(PriceAlertSchema),
  customRates: z.array(CustomRateSchema),
});
type User = z.infer<typeof UserSchema>;
const initial: User = {
  settings: {
    unit: "IRT",
    persian: true,
    haptics: true,
    appearance: "dark",
    refresh: 60,
  },
  watchlist: ["USD", "EUR", "AED", "IQD"],
  alerts: [],
  customRates: [],
};
function useAppStore() {
  const [user, setUser] = useState(initial);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const [notice, setNotice] = useState<AlertNotice | null>(null);
  const userRef = useRef(user);
  userRef.current = user;
  const active = useRef(true);
  const inFlight = useRef<AbortController | null>(null);
  const failures = useRef(0);
  const nextTry = useRef(0);
  const previous = useRef<Record<string, HistoricalPoint>>({});
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [u, m] = await Promise.all([readLocal("user"), readLocal("market")]);
        const parsedUser = u ? UserSchema.parse(JSON.parse(u)) : initial;
        if (mounted) {
          setUser(parsedUser);
          if (m) {
            try {
              const data = MarketSnapshotSchema.parse(JSON.parse(m));
              setSnapshot({
                ...data,
                status: "stale",
                quotes: data.quotes.map((q) => ({ ...q, stale: true })),
              });
            } catch {
              // Corrupt disposable market cache must not block private ledger recovery.
              await clearMarketCache();
            }
          }
        }
      } catch {
        if (mounted)
          setStorageError(
            "خواندن داده‌های ذخیره‌شده ناموفق بود. برای جلوگیری از بازنویسی، برنامه را دوباره باز کنید.",
          );
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const updateUser = useCallback(
    (fn: (u: User) => User) => {
      if (!ready || storageError) return;
      const next = UserSchema.parse(fn(userRef.current));
      userRef.current = next;
      setUser(next);
      saveQueue.current = saveQueue.current
        .then(() => writeLocal("user", JSON.stringify(next)))
        .catch(() => setStorageError("ذخیرهٔ تنظیمات انجام نشد"));
    },
    [ready, storageError],
  );
  const refresh = useCallback(
    async (force = false) => {
      if (
        !active.current ||
        inFlight.current ||
        (!force && Date.now() < nextTry.current)
      )
        return;
      if (!apiUrl) {
        setError("سرویس نرخ هنوز متصل نشده است؛ راهنمای راه‌اندازی را ببینید");
        return;
      }
      const controller = new AbortController();
      inFlight.current = controller;
      setBusy(true);
      const timeout = setTimeout(() => controller.abort(), 55_000);
      try {
        // v2 carries all 24 currencies. A service that predates it answers 404,
        // and then the four core currencies from v1 still keep the app working.
        let response = await fetch(`${apiUrl}/api/v2/market`, {
          signal: controller.signal,
        });
        if (response.status === 404)
          response = await fetch(`${apiUrl}/api/market`, {
            signal: controller.signal,
          });
        if (!response.ok) throw new Error("Service unavailable");
        const data = MarketSnapshotSchema.parse(await response.json());
        if (controller.signal.aborted) return;
        setSnapshot(data);
        setOnline(true);
        setError(null);
        failures.current = 0;
        nextTry.current = Date.now() + userRef.current.settings.refresh * 1000;
        void writeLocal("market", JSON.stringify(data)).catch(() =>
          setStorageError("ذخیرهٔ کش نرخ انجام نشد"),
        );
        const now = Date.now();
        const triggered = userRef.current.alerts.filter((a) => {
          const q = data.quotes.find((q) => q.currency === a.currency);
          return q && alertMatches(a, q, previous.current[a.currency], now);
        });
        if (triggered.length) {
          updateUser((u) => ({
            ...u,
            alerts: u.alerts.map((a) =>
              triggered.some((t) => t.id === a.id)
                ? { ...a, triggeredAt: new Date(now).toISOString() }
                : a,
            ),
          }));
          const next = makeNotice(
            triggered,
            now,
            userRef.current.settings.persian,
          );
          setNotice(next);
          notifyBrowser(next);
        }
        for (const q of data.quotes)
          previous.current[q.currency] = observationOf(q, now);
      } catch {
        if (active.current) {
          setOnline(false);
          setError(
            "ارتباط با سرویس برقرار نشد؛ آخرین نرخ ذخیره‌شده نمایش داده می‌شود",
          );
          failures.current++;
          nextTry.current =
            Date.now() +
            Math.min(300_000, 15_000 * 2 ** Math.min(failures.current, 5));
        }
      } finally {
        clearTimeout(timeout);
        inFlight.current = null;
        setBusy(false);
        setClock(Date.now());
      }
    },
    [updateUser],
  );
  useEffect(() => {
    if (!ready) return;
    void refresh();
    const timer = setInterval(() => {
      setClock(Date.now());
      void refresh();
    }, 15000);
    const sub = AppState.addEventListener("change", (state) => {
      active.current = state === "active";
      if (active.current) void refresh(true);
      else inFlight.current?.abort();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
      inFlight.current?.abort();
    };
  }, [ready, refresh]);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const haptic = () => {
    if (user.settings.haptics && Platform.OS !== "web")
      void Haptics.selectionAsync().catch(() => undefined);
  };
  return {
    user,
    updateUser,
    snapshot,
    busy,
    ready,
    error,
    storageError,
    online,
    clock,
    refresh,
    haptic,
    notice,
    dismissNotice,
    clearCache: async () => {
      await clearMarketCache();
      setSnapshot(null);
    },
    stale:
      !online || !snapshot || snapshot.quotes.some((q) => isStale(q, clock)),
  };
}
type Store = ReturnType<typeof useAppStore>;
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  return <Context.Provider value={useAppStore()}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider missing");
  return value;
}
