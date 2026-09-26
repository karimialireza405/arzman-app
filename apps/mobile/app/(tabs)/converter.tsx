/**
 * Converter — «مبدل»
 *
 * Pattern from the Dribbble exchange references: two compact cards ("you pay"
 * / "you get"), each a single row with the amount on one side and a currency
 * pill on the other, a brand swap button bridging them, and a native sheet for
 * choosing a currency. It replaces two six-flag grids that took half the
 * screen. The conversion itself is unchanged: `convert` over the market quotes.
 */
import { useRef, useState } from "react";
import { Alert, Animated, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  convert,
  parseAmount,
  formatNumber,
  formatAmount,
  names,
  fiatCodes,
  type ConversionCurrency,
} from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  AppIcon,
  Button,
  CurrencyBadge,
  Divider,
  IconButton,
  Label,
  MarketStatus,
  Screen,
  Surface,
  appFont,
  curve,
  fontFamilies,
  spacing,
  useFeedback,
  usePrice,
  useTheme,
} from "../../src/ui";

const codes = [...fiatCodes, "IRT", "IRR"] as const;

/** Pill labels: the card is one row, so the pill carries the short name. */
const shortNames: Record<ConversionCurrency, string> = {
  USD: "دلار",
  EUR: "یورو",
  AED: "درهم",
  IQD: "دینار",
  IRT: "تومان",
  IRR: "ریال",
};

const QUICK_AMOUNTS = [1, 10, 100, 1000];

function CurrencyPill({
  code,
  onPress,
  label,
}: {
  code: ConversionCurrency;
  onPress: () => void;
  label: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}، ${names[code]}. برای تغییر لمس کنید`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 6,
        height: 42,
        paddingStart: 6,
        paddingEnd: 12,
        borderRadius: 21,
        backgroundColor: pressed ? t.fillSecondary : t.fillTertiary,
        borderWidth: 1,
        borderColor: t.separator,
      })}
    >
      <CurrencyBadge code={code} size={30} dark={t.dark} />
      <Label size={15} weight="700">
        {shortNames[code]}
      </Label>
      <AppIcon name="chevron-down" size={14} color={t.textSecondary} />
    </Pressable>
  );
}

function ExchangeCard({
  label,
  code,
  onPickCurrency,
  children,
}: {
  label: string;
  code: ConversionCurrency;
  onPickCurrency: () => void;
  children: React.ReactNode;
}) {
  return (
    <Surface style={{ gap: spacing.xxs, paddingVertical: spacing.sm }}>
      <Label secondary size={13} weight="500">
        {label}
      </Label>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs }}>
        <View style={{ flex: 1 }}>{children}</View>
        <CurrencyPill code={code} onPress={onPickCurrency} label={label} />
      </View>
    </Surface>
  );
}

/** Native sheet listing every currency with its current rate. */
function CurrencySheet({
  visible,
  title,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  selected: ConversionCurrency;
  onSelect: (code: ConversionCurrency) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const app = useApp();
  const fmt = usePrice();
  const rateOf = (code: ConversionCurrency) =>
    code === "IRT"
      ? 1
      : code === "IRR"
        ? 0.1
        : (app.snapshot?.quotes.find((q) => q.currency === code)?.priceToman ?? null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing.sm,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xs,
          }}
        >
          <Label size={20} weight="700">
            {title}
          </Label>
          <IconButton icon="close-outline" size={34} accessibilityLabel="بستن" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.sm, paddingTop: 0 }}>
          <Surface padded={false}>
            {codes.map((code, index) => {
              const rate = rateOf(code);
              const active = code === selected;
              return (
                <View key={code}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={names[code]}
                    onPress={() => onSelect(code)}
                    style={({ pressed }) => ({
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: spacing.xs,
                      minHeight: 64,
                      paddingHorizontal: spacing.sm,
                      backgroundColor: pressed ? t.pressedOverlay : "transparent",
                    })}
                  >
                    <CurrencyBadge code={code} size={40} dark={t.dark} />
                    <View style={{ flex: 1 }}>
                      <Label size={17} weight="600">
                        {names[code]}
                      </Label>
                      <Label secondary size={13}>
                        {code}
                      </Label>
                    </View>
                    <Label secondary size={14} style={{ writingDirection: "rtl" }}>
                      {rate === null ? "—" : `${fmt(rate)} ${names[app.user.settings.unit]}`}
                    </Label>
                    <View style={{ width: 22, alignItems: "center" }}>
                      {active ? <AppIcon name="check" size={18} color={t.accent} /> : null}
                    </View>
                  </Pressable>
                  {index < codes.length - 1 ? <Divider inset={68} /> : null}
                </View>
              );
            })}
          </Surface>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function Converter() {
  const app = useApp();
  const t = useTheme();
  const feedback = useFeedback();
  const params = useLocalSearchParams<{ from?: string }>();
  const persian = app.user.settings.persian;

  const [from, setFrom] = useState<ConversionCurrency>(
    codes.includes(params.from as ConversionCurrency)
      ? (params.from as ConversionCurrency)
      : "USD",
  );
  // Never open on an X → X conversion when arriving with ?from=IRT.
  const [to, setTo] = useState<ConversionCurrency>(from === "IRT" ? "USD" : "IRT");
  const [amount, setAmount] = useState(persian ? "۱" : "1");
  const [picking, setPicking] = useState<"from" | "to" | null>(null);

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

  // Native-feel swap: the button turns half a revolution with a spring.
  const rotation = useRef(new Animated.Value(0)).current;
  const swap = () => {
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
  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  // Picking the currency that is already on the other side swaps them, rather
  // than leaving a pointless X → X conversion.
  const choose = (code: ConversionCurrency) => {
    feedback.tap();
    if (picking === "from") {
      if (code === to) setTo(from);
      setFrom(code);
    } else if (picking === "to") {
      if (code === from) setFrom(to);
      setTo(code);
    }
    setPicking(null);
  };

  const copyResult = async () => {
    if (result === null) return;
    feedback.success();
    const text = `${formatAmount(result, false)} ${names[to]}`;
    await Clipboard.setStringAsync(text);
    Alert.alert("کپی شد", `مبلغ «${text}» در حافظه کپی شد.`);
  };

  const quick = (n: number) => formatNumber(n, persian, 0);
  const current = (() => {
    try {
      return amount ? parseAmount(amount) : null;
    } catch {
      return null;
    }
  })();

  return (
    <Screen title="مبدل ارز" eyebrow="تبدیل با نرخ لحظه‌ای بازار آزاد">
      <MarketStatus />

      <View>
        <ExchangeCard label="مبلغ" code={from} onPickCurrency={() => setPicking("from")}>
          <TextInput
            accessibilityLabel={`مبلغ به ${names[from]}`}
            value={amount}
            onChangeText={setAmount}
            placeholder="۰"
            placeholderTextColor={t.textTertiary}
            keyboardType="decimal-pad"
            inputMode="decimal"
            returnKeyType="done"
            allowFontScaling={false}
            style={{
              color: t.text,
              fontFamily: appFont(fontFamilies.bold),
              fontWeight: appFont(fontFamilies.bold) ? undefined : "700",
              fontSize: 32,
              minHeight: 50,
              textAlign: "right",
              writingDirection: "ltr",
              paddingVertical: 0,
            }}
          />
        </ExchangeCard>

        {/* The brand swap control bridges the two cards. */}
        <View style={{ alignItems: "center", marginVertical: -18, zIndex: 2 }}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="جابه‌جایی مبدأ و مقصد"
              onPress={swap}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: t.accentSolid,
                borderWidth: 4,
                borderColor: t.background,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <AppIcon name="swap-vertical" size={18} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>

        <ExchangeCard label="معادل" code={to} onPickCurrency={() => setPicking("to")}>
          <Label
            size={32}
            weight="700"
            numberOfLines={1}
            allowFontScaling={false}
            style={{ writingDirection: "ltr", textAlign: "right" }}
          >
            {result === null ? "—" : formatAmount(result, persian)}
          </Label>
        </ExchangeCard>
      </View>

      {/* Quick amounts for the common cases. */}
      <View style={{ flexDirection: "row-reverse", gap: spacing.xxs }}>
        {QUICK_AMOUNTS.map((n) => {
          const selected = current === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`مبلغ ${quick(n)}`}
              onPress={() => {
                feedback.tap();
                setAmount(quick(n));
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 38,
                borderRadius: 19,
                borderCurve: curve.continuous,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected ? t.accentFill : pressed ? t.fillSecondary : t.fillTertiary,
                borderWidth: 1,
                borderColor: selected ? t.accent : "transparent",
              })}
            >
              <Label size={14} weight="600" style={{ color: selected ? t.accent : t.text }}>
                {quick(n)}
              </Label>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: spacing.xs }}>
        {singleRate !== null ? (
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: spacing.xxs,
            }}
          >
            <Label tertiary size={13}>
              نرخ پایه
            </Label>
            <Label secondary size={13} weight="600" style={{ writingDirection: "rtl" }}>
              ۱ {names[from]} = {formatAmount(singleRate, persian)} {names[to]}
            </Label>
          </View>
        ) : null}

        {!!error && (
          <Label red size={13}>
            {error}
          </Label>
        )}

        <Button
          title="کپی نتیجه"
          icon="copy-outline"
          variant="prominent"
          size="large"
          fullWidth
          disabled={result === null}
          onPress={copyResult}
        />
        <Label tertiary size={11} align="center">
          نسبت مستقیم نرخ بازار آزاد؛ بدون کارمزد یا کمیسیون صرافی.
        </Label>
      </View>

      <CurrencySheet
        visible={picking !== null}
        title={picking === "to" ? "ارز مقصد" : "ارز مبدأ"}
        selected={picking === "to" ? to : from}
        onSelect={choose}
        onClose={() => setPicking(null)}
      />
    </Screen>
  );
}
