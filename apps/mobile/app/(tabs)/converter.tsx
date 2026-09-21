/**
 * Converter — «مبدل»
 *
 * First-party utility feel: two quiet surfaces, a floating swap control between
 * them, one prominent CTA. The currency pickers reuse the CurrencyBadge family
 * so the picker looks like the rest of the app, not like a web form.
 */
import { useRef, useState } from "react";
import { Alert, Animated, Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  convert,
  parseAmount,
  formatNumber,
  names,
  fiatCodes,
  type ConversionCurrency,
} from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  AmountInput,
  Button,
  CurrencyBadge,
  IconButton,
  Label,
  MarketStatus,
  Screen,
  Surface,
  curve,
  radii,
  spacing,
  useFeedback,
  useTheme,
} from "../../src/ui";

const codes = [...fiatCodes, "IRT", "IRR"] as const;

function CurrencyPicker({
  value,
  onChange,
}: {
  value: ConversionCurrency;
  onChange: (next: ConversionCurrency) => void;
}) {
  const t = useTheme();
  const feedback = useFeedback();
  return (
    <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.xxs }}>
      {codes.map((code) => {
        const selected = code === value;
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityLabel={names[code]}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              feedback.tap();
              onChange(code);
            }}
            style={{
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: radii.control,
              borderCurve: curve.continuous,
              borderWidth: 1,
              borderColor: selected ? t.accent : "transparent",
              backgroundColor: selected ? t.accentFill : "transparent",
            }}
          >
            <CurrencyBadge code={code} size="sm" dark={t.dark} tone={selected ? "filled" : "tint"} />
            <Label
              size={10}
              weight={selected ? "700" : "500"}
              allowFontScaling={false}
              style={{ color: selected ? t.accent : t.textSecondary }}
            >
              {names[code]}
            </Label>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Converter() {
  const app = useApp();
  const feedback = useFeedback();
  const params = useLocalSearchParams<{ from?: string }>();

  const [from, setFrom] = useState<ConversionCurrency>(
    codes.includes(params.from as ConversionCurrency)
      ? (params.from as ConversionCurrency)
      : "USD",
  );
  const [to, setTo] = useState<ConversionCurrency>("IRT");
  const [amount, setAmount] = useState("1");

  const quotes = app.snapshot?.quotes ?? [];
  let result: number | null = null;
  let singleRate: number | null = null;
  let error = "";

  try {
    if (amount) result = convert(parseAmount(amount), from, to, quotes);
  } catch (e) {
    error = e instanceof Error ? e.message : "ورودی نامعتبر";
  }
  try {
    singleRate = convert(1, from, to, quotes);
  } catch {
    singleRate = null;
  }

  const copyResult = async () => {
    if (result === null) return;
    feedback.success();
    const text = `${formatNumber(result, false, 4)} ${names[to]}`;
    await Clipboard.setStringAsync(text);
    Alert.alert("کپی شد", `مبلغ «${text}» در حافظه کپی شد.`);
  };

  return (
    <Screen title="مبدل ارز" eyebrow="تبدیل هوشمند با نرخ بازار آزاد">
      <MarketStatus />
      <ConverterBody
        from={from}
        to={to}
        amount={amount}
        setAmount={setAmount}
        setFrom={setFrom}
        setTo={setTo}
        result={result}
        singleRate={singleRate}
        error={error}
        copyResult={copyResult}
      />
    </Screen>
  );
}

function ConverterBody({
  from,
  to,
  amount,
  setAmount,
  setFrom,
  setTo,
  result,
  singleRate,
  error,
  copyResult,
}: {
  from: ConversionCurrency;
  to: ConversionCurrency;
  amount: string;
  setAmount: (next: string) => void;
  setFrom: (next: ConversionCurrency) => void;
  setTo: (next: ConversionCurrency) => void;
  result: number | null;
  singleRate: number | null;
  error: string;
  copyResult: () => void;
}) {
  const t = useTheme();
  const app = useApp();
  const feedback = useFeedback();

  // Native-feel swap: the compact control flips 180° with a spring.
  const rotation = useRef(new Animated.Value(0)).current;
  const handleSwap = () => {
    feedback.press();
    Animated.spring(rotation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 220,
      mass: 0.8,
    }).start(() => rotation.setValue(0));
    setFrom(to);
    setTo(from);
  };
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <>
      {/* Source surface */}
      <Surface style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs }}>
          <CurrencyBadge code={from} size="md" tone="filled" dark={t.dark} />
          <View style={{ flex: 1, gap: 1 }}>
            <Label size={15} weight="600">از {names[from]}</Label>
            <Label tertiary size={11} allowFontScaling={false}>{from}</Label>
          </View>
        </View>
        <AmountInput label="مبلغ" value={amount} onChangeText={setAmount} unit={from} />
        <CurrencyPicker value={from} onChange={setFrom} />
      </Surface>

      {/* Swap control — compact, floating between the two surfaces */}
      <View style={{ alignItems: "center", marginVertical: -spacing.xs, zIndex: 2 }}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <IconButton
            icon="swap-vertical"
            size={44}
            accessibilityLabel="جابه‌جایی مبدأ و مقصد"
            onPress={handleSwap}
          />
        </Animated.View>
      </View>

      {/* Destination surface */}
      <Surface style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs }}>
          <CurrencyBadge code={to} size="md" tone="filled" dark={t.dark} />
          <View style={{ flex: 1, gap: 1 }}>
            <Label size={15} weight="600">به {names[to]}</Label>
            <Label tertiary size={11} allowFontScaling={false}>{to}</Label>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Label tertiary size={12}>مبلغ محاسبه‌شده</Label>
          <Label
            allowFontScaling={false}
            style={{
              fontSize: 32,
              lineHeight: 38,
              fontWeight: "700",
              letterSpacing: -0.4,
              fontVariant: ["tabular-nums"],
              writingDirection: "ltr",
            }}
          >
            {result === null ? "—" : formatNumber(result, app.user.settings.persian, 4)}
          </Label>
          <Label secondary size={13} weight="600">{names[to]}</Label>
        </View>

        <CurrencyPicker value={to} onChange={setTo} />

        {singleRate !== null ? (
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Label tertiary size={12}>نرخ پایه</Label>
            <Label
              size={12}
              weight="600"
              allowFontScaling={false}
              style={{ writingDirection: "ltr", fontVariant: ["tabular-nums"] }}
            >
              ۱ {names[from]} = {formatNumber(singleRate, app.user.settings.persian, 4)} {names[to]}
            </Label>
          </View>
        ) : null}

        {!!error && <Label red size={13}>{error}</Label>}

        <Button
          title="کپی نتیجه"
          icon="copy-outline"
          variant="prominent"
          size="large"
          fullWidth
          disabled={result === null}
          onPress={copyResult}
        />
      </Surface>

      <View style={{ paddingHorizontal: spacing.xxs }}>
        <Label tertiary size={11} align="center" style={{ lineHeight: 17 }}>
          محاسبهٔ تبدیل از نسبت مستقیم نرخ بازار آزاد به دست می‌آید و خالص از
          کمیسیون یا کارمزد صرافی است.
        </Label>
      </View>
    </>
  );
}
