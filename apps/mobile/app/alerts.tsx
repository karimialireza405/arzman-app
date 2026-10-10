/**
 * Price alerts — «هشدارهای قیمت» (modal sheet).
 *
 * Form-first layout: pick currency → pick condition → enter threshold → save.
 * The honesty notice stays: alerts are evaluated only while the app is open.
 */
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import {
  CurrencySchema,
  fiatCodes,
  names,
  shortNames,
  PriceAlertSchema,
  parseAmount,
  formatNumber,
  type Currency,
  type PriceAlert,
} from "@arzman/shared";
import { useApp } from "../src/store";
import {
  browserPermission,
  requestBrowserPermission,
} from "../src/alert-notice";
import {
  AmountInput,
  AppIcon,
  Button,
  ChipRow,
  CurrencyBadge,
  EmptyState,
  GroupedList,
  Label,
  Screen,
  Section,
  SegmentedControl,
  Surface,
  radii,
  spacing,
  useFeedback,
  useTheme,
} from "../src/ui";

const labels: Record<PriceAlert["kind"], string> = {
  above: "افزایش به بالاتر از",
  below: "کاهش به پایین‌تر از",
  percent: "تغییر روزانه بیش از",
  rapid: "حرکت سریع ۵ دقیقه‌ای",
};

const shortKindLabels: Record<PriceAlert["kind"], string> = {
  above: "بالاتر از",
  below: "پایین‌تر از",
  percent: "نوسان ٪",
  rapid: "جهش ۵د",
};

export default function Alerts() {
  const app = useApp();
  const t = useTheme();
  const feedback = useFeedback();
  const params = useLocalSearchParams<{ currency?: string }>();

  const [currency, setCurrency] = useState<Currency>(
    CurrencySchema.safeParse(params.currency).success
      ? (params.currency as Currency)
      : "USD",
  );
  const [kind, setKind] = useState<PriceAlert["kind"]>("above");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const [permission, setPermission] = useState(browserPermission());
  useEffect(() => setPermission(browserPermission()), []);

  const kinds = ["above", "below", "percent", "rapid"] as const;

  const handleCreate = () => {
    try {
      const alert = PriceAlertSchema.parse({
        id: String(Date.now()),
        currency,
        kind,
        threshold: parseAmount(amount),
        enabled: true,
        triggeredAt: null,
      });
      app.updateUser((u) => ({ ...u, alerts: [...u.alerts, alert] }));
      feedback.success();
      setAmount("");
      setError("");
    } catch {
      setError("لطفاً آستانهٔ عددی مثبت و معتبر وارد نمایید");
    }
  };

  return (
    <Screen
      title="هشدارهای قیمت"
      eyebrow="نظارت لحظه‌ای بر بازار"
      largeTitle={false}
    >
      {/* Honest capability note — apple-style inline notice, not a banner card */}
      <Surface
        style={{
          flexDirection: "row-reverse",
          gap: spacing.xs,
          alignItems: "flex-start",
          backgroundColor: t.amberFill,
        }}
      >
        <AppIcon
          name="info"
          size={18}
          color={t.amber}
          style={{ marginTop: 2 }}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Label size={13} weight="600" style={{ color: t.amberText }}>
            نحوهٔ عملکرد هشدارها
          </Label>
          <Label secondary size={12} style={{ lineHeight: 18 }}>
            هشدارها فقط وقتی برنامه باز است (و روی صفحه یا در پس‌زمینهٔ نزدیک)
            بررسی می‌شوند و با یک بنر داخل برنامه نشان داده می‌شوند. اگر برنامه
            بسته باشد هیچ اعلانی نمی‌رسد؛ اعلان پس از بستن برنامه به سرور پوش
            نیاز دارد و هنوز فعال نیست.
          </Label>
          {permission === "default" && (
            <Button
              title="فعال‌سازی اعلان مرورگر"
              variant="plain"
              size="small"
              onPress={() =>
                void requestBrowserPermission().then(setPermission)
              }
            />
          )}
          {permission === "granted" && (
            <Label secondary size={12}>
              اعلان مرورگر فعال است (باز هم فقط تا وقتی برنامه باز است).
            </Label>
          )}
          {permission === "denied" && (
            <Label secondary size={12}>
              اعلان مرورگر مسدود است؛ از تنظیمات مرورگر می‌توانید آن را باز
              کنید.
            </Label>
          )}
        </View>
      </Surface>

      {/* Create form */}
      <Section title="هشدار جدید">
        <Surface style={{ gap: spacing.sm }}>
          <View style={{ gap: spacing.xxs }}>
            <Label secondary size={13} weight="600">
              انتخاب ارز
            </Label>
            <ChipRow
              values={fiatCodes}
              value={currency}
              onChange={setCurrency}
              label={(c) => shortNames[c]}
              leading={(c) => (
                <CurrencyBadge code={c} size={28} dark={t.dark} />
              )}
              accessibilityLabel="انتخاب ارز"
            />
          </View>

          <View style={{ gap: spacing.xxs }}>
            <Label secondary size={13} weight="600">
              شرط فعال‌سازی
            </Label>
            <SegmentedControl
              values={kinds}
              value={kind}
              onChange={setKind}
              label={(k) => shortKindLabels[k]}
              size="compact"
            />
          </View>

          <AmountInput
            label={labels[kind]}
            value={amount}
            onChangeText={setAmount}
            unit={kind === "above" || kind === "below" ? "تومان" : "٪"}
          />

          {!!error && (
            <Label red size={13}>
              {error}
            </Label>
          )}

          <Button
            title="افزودن هشدار"
            icon="add"
            variant="prominent"
            size="large"
            fullWidth
            disabled={!amount}
            onPress={handleCreate}
          />
        </Surface>
      </Section>

      {/* Existing alerts */}
      <Section
        title="هشدارهای فعال"
        subtitle={`${formatNumber(app.user.alerts.length, app.user.settings.persian)} هشدار`}
      >
        {app.user.alerts.length === 0 ? (
          <Surface>
            <EmptyState
              title="هشداری تعریف نشده است"
              description="با تعیین آستانه، هنگام باز بودن برنامه از تغییرات نرخ مطلع می‌شوید."
              icon="notifications-outline"
            />
          </Surface>
        ) : (
          <GroupedList separatorInset={66}>
            {app.user.alerts.map((a) => {
              const isTriggered = !!a.triggeredAt;
              const isEnabled = a.enabled;
              const statusColor = isTriggered
                ? t.redText
                : isEnabled
                  ? t.greenText
                  : t.textTertiary;
              return (
                <View
                  key={a.id}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    gap: spacing.xxs,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: spacing.xs,
                    }}
                  >
                    <CurrencyBadge code={a.currency} size="md" dark={t.dark} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <Label size={16} weight="600">
                        {names[a.currency]}
                      </Label>
                      <Label secondary size={12} allowFontScaling={false}>
                        {labels[a.kind]}{" "}
                        {formatNumber(a.threshold, app.user.settings.persian)}{" "}
                        {a.kind === "above" || a.kind === "below"
                          ? "تومان"
                          : "٪"}
                      </Label>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: spacing.xxs,
                        paddingVertical: 3,
                        borderRadius: radii.pill,
                        backgroundColor: isTriggered
                          ? t.redFill
                          : isEnabled
                            ? t.greenFill
                            : t.fillTertiary,
                      }}
                    >
                      <Label
                        size={11}
                        weight="600"
                        style={{ color: statusColor }}
                      >
                        {isTriggered
                          ? "فعال‌شده"
                          : isEnabled
                            ? "در حال پایش"
                            : "متوقف"}
                      </Label>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row-reverse",
                      gap: spacing.xxs,
                      paddingStart: 50,
                    }}
                  >
                    <Button
                      title={
                        isTriggered
                          ? "فعال‌سازی مجدد"
                          : isEnabled
                            ? "توقف موقت"
                            : "فعال‌سازی"
                      }
                      variant="plain"
                      size="small"
                      onPress={() =>
                        app.updateUser((u) => ({
                          ...u,
                          alerts: u.alerts.map((item) =>
                            item.id === a.id
                              ? {
                                  ...item,
                                  enabled: isTriggered ? true : !item.enabled,
                                  triggeredAt: null,
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                    <Button
                      title="حذف"
                      variant="plain"
                      size="small"
                      textStyle={{ color: t.red }}
                      onPress={() =>
                        app.updateUser((u) => ({
                          ...u,
                          alerts: u.alerts.filter((item) => item.id !== a.id),
                        }))
                      }
                    />
                  </View>
                </View>
              );
            })}
          </GroupedList>
        )}
      </Section>
    </Screen>
  );
}
