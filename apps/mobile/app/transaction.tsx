/**
 * Transaction entry — «ثبت تراکنش» (modal sheet).
 *
 * iOS form idiom: segmented choice rows, large tabular numeric fields, a live
 * total preview, and a single prominent save action.
 */
import { useEffect, useState } from "react";
import { AppState, Platform, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import {
  AssetSchema,
  names,
  parseAmount,
  calculatePortfolio,
  PortfolioTransactionSchema,
  formatNumber,
} from "@arzman/shared";
import { useApp } from "../src/store";
import {
  AmountInput,
  Button,
  EmptyState,
  Label,
  Screen,
  SegmentedControl,
  Surface,
  radii,
  spacing,
  useFeedback,
  useTheme,
} from "../src/ui";

const types = ["buy", "sell", "adjustment"] as const;
type TxType = (typeof types)[number];

const typeLabels: Record<TxType, string> = {
  buy: "خرید",
  sell: "فروش",
  adjustment: "اصلاح موجودی",
};

export default function Transaction() {
  const app = useApp();
  const t = useTheme();
  const feedback = useFeedback();

  const [currency, setCurrency] = useState<typeof AssetSchema._output>("USD");
  const [kind, setKind] = useState<TxType>("buy");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const s = AppState.addEventListener("change", (state) => {
      if (state !== "active") setAuthorized(false);
    });
    return () => s.remove();
  }, []);

  if (app.user.settings.privacy && !authorized) {
    return (
      <Screen title="تأیید هویت" eyebrow="ثبت امن تراکنش دارایی" floatingTabBar={false}>
        <EmptyState
          title="نیاز به احراز هویت دستگاه"
          description="برای ثبت تراکنش دارایی، تأیید با Face ID یا رمز عبور دستگاه الزامی است."
          icon="lock-closed-outline"
        />
        <Button
          title="تأیید هویت"
          variant="prominent"
          size="large"
          fullWidth
          onPress={() => {
            if (Platform.OS === "web") {
              setError("این قابلیت به دستگاه نیاز دارد");
              return;
            }
            void LocalAuthentication.authenticateAsync({
              promptMessage: "ثبت تراکنش دارایی",
            })
              .then((r) => setAuthorized(r.success))
              .catch(() => setError("احراز هویت انجام نشد"));
          }}
        />
        {!!error && (
          <Label red size={13} align="center">
            {error}
          </Label>
        )}
      </Screen>
    );
  }

  let totalEstimatedToman: number | null = null;
  try {
    if (quantity && cost) {
      totalEstimatedToman = parseAmount(quantity) * parseAmount(cost);
    }
  } catch {
    totalEstimatedToman = null;
  }

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const tx = PortfolioTransactionSchema.parse({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        currency,
        type: kind,
        quantity: parseAmount(quantity),
        costToman: parseAmount(cost),
        timestamp: new Date().toISOString(),
      });
      calculatePortfolio([...app.transactions, tx]);
      await app.saveTransaction(tx);
      feedback.success();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورودی نامعتبر است");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="ثبت تراکنش" eyebrow="ذخیرهٔ محلی و امن" floatingTabBar={false}>
      <Surface style={{ gap: spacing.sm }}>
        <View style={{ gap: spacing.xxs }}>
          <Label secondary size={13} weight="600">نوع عملیات مالی</Label>
          <SegmentedControl
            values={types}
            value={kind}
            onChange={setKind}
            label={(k) => typeLabels[k]}
          />
        </View>

        <View style={{ gap: spacing.xxs }}>
          <Label secondary size={13} weight="600">انتخاب دارایی</Label>
          <SegmentedControl
            values={AssetSchema.options}
            value={currency}
            onChange={setCurrency}
            label={(c) => names[c]}
            size="compact"
          />
        </View>

        <AmountInput
          label={
            kind === "adjustment"
              ? `موجودی کل جدید · ${names[currency]}`
              : `تعداد / حجم معامله · ${names[currency]}`
          }
          value={quantity}
          onChangeText={setQuantity}
          unit={currency}
        />

        <AmountInput
          label={
            kind === "adjustment"
              ? "میانگین بهای خرید جدید هر واحد (تومان)"
              : "قیمت هر واحد (تومان)"
          }
          value={cost}
          onChangeText={setCost}
          unit="تومان"
        />

        {totalEstimatedToman !== null && kind !== "adjustment" ? (
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: t.fillQuaternary,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radii.controlSmall,
              borderCurve: "continuous",
            }}
          >
            <Label secondary size={13}>ارزش کل این معامله</Label>
            <Label
              allowFontScaling={false}
              style={{
                fontSize: 17,
                fontWeight: "700",
                fontVariant: ["tabular-nums"],
                writingDirection: "ltr",
              }}
            >
              {formatNumber(totalEstimatedToman, app.user.settings.persian, 0)} تومان
            </Label>
          </View>
        ) : null}

        {kind === "adjustment" ? (
          <View
            style={{
              backgroundColor: t.amberFill,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radii.controlSmall,
              borderCurve: "continuous",
            }}
          >
            <Label size={12} style={{ color: t.amberText, lineHeight: 18 }}>
              در حالت اصلاح موجودی، میزان کل دارایی و میانگین خرید شما برای{" "}
              {names[currency]} با این مقادیر بازنویسی می‌شود.
            </Label>
          </View>
        ) : null}

        {!!error && <Label red size={13}>{error}</Label>}

        <Button
          title={saving ? "در حال ذخیره روی دستگاه…" : "ذخیره تراکنش"}
          icon="check"
          variant="prominent"
          size="large"
          fullWidth
          loading={saving}
          disabled={saving || !app.ready || !!app.storageError}
          onPress={() => void save()}
        />
      </Surface>

      <View style={{ paddingHorizontal: spacing.xxs }}>
        <Label tertiary size={11} align="center" style={{ lineHeight: 17 }}>
          تراکنش‌ها فقط در حافظهٔ دستگاه ذخیره می‌شوند و در محاسبهٔ میانگین خرید
          و سود/زیان لحاظ می‌گردند.
        </Label>
      </View>
    </Screen>
  );
}

