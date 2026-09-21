import type {
  CurrencyQuote,
  Currency,
  ConversionCurrency,
} from "@arzman/shared";

/** Explicit adapters: the base app never imports an uninstalled native extension. */
export interface WidgetSnapshot {
  version: 1;
  quotes: CurrencyQuote[];
  generatedAt: string;
}
export interface WidgetBridge {
  writeSharedSnapshot(snapshot: WidgetSnapshot): Promise<void>;
  reloadTimelines(): Promise<void>;
}
export interface LiveActivityBridge {
  start(currency: Currency): Promise<string>;
  update(id: string, quote: CurrencyQuote): Promise<void>;
  end(id: string): Promise<void>;
}
export type ShortcutRequest =
  | { action: "quote"; currency: Currency }
  | {
      action: "convert";
      amount: number;
      from: ConversionCurrency;
      to: ConversionCurrency;
    };
export interface PushRegistration {
  installationId: string;
  expoPushToken: string;
  locale: "fa-IR";
}
export const nativeCapabilities = {
  widgets: false,
  liveActivities: false,
  appIntents: false,
  serverPush: false,
} as const;
