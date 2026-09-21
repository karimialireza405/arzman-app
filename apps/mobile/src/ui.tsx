import React, { useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Platform,
  Animated,
  ActivityIndicator,
  type ColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  GlassView,
  GlassContainer as NativeGlassContainer,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Svg, { Polyline, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  formatNumber,
  names,
  type CurrencyQuote,
  type Currency,
} from "@arzman/shared";
import { useApp } from "./store";
import {
  ArzManDesignSystem,
  colors as systemColors,
  radii,
  spacing,
  typography,
  concentricRadius,
} from "./design-system";

export { ArzManDesignSystem, radii, spacing, typography, concentricRadius };

export const tokens = {
  space: { xs: 8, sm: 12, md: 16, lg: 20, xl: 28, xxl: 40 },
  radius: { card: radii.card, control: radii.control, pill: radii.pill },
  dark: systemColors.dark,
  light: systemColors.light,
};

export function useTheme() {
  const { user } = useApp();
  const system = useColorScheme();
  const dark =
    user.settings.appearance === "dark" ||
    (user.settings.appearance === "system" && system !== "light");
  const current = dark ? systemColors.dark : systemColors.light;
  return {
    ...current,
    dark,
  };
}

/** Icon resolver mapping between Apple SF Symbols on iOS and Ionicons fallback */
const iconMapping: Record<
  string,
  { sf: SFSymbol; ion: keyof typeof Ionicons.glyphMap }
> = {
  home: { sf: "house.fill", ion: "home" },
  "home-outline": { sf: "house", ion: "home-outline" },
  market: { sf: "chart.xyaxis.line", ion: "stats-chart" },
  "stats-chart": { sf: "chart.line.uptrend.xyaxis", ion: "stats-chart" },
  "stats-chart-outline": {
    sf: "chart.line.uptrend.xyaxis",
    ion: "stats-chart-outline",
  },
  swap: { sf: "arrow.left.arrow.right", ion: "swap-horizontal" },
  "swap-horizontal": {
    sf: "arrow.left.arrow.right",
    ion: "swap-horizontal",
  },
  "swap-vertical": { sf: "arrow.up.arrow.down", ion: "swap-vertical" },
  wallet: { sf: "wallet.pass.fill", ion: "wallet" },
  "wallet-outline": { sf: "wallet.pass", ion: "wallet-outline" },
  more: { sf: "ellipsis.circle.fill", ion: "ellipsis-horizontal-circle" },
  "ellipsis-horizontal-circle-outline": {
    sf: "ellipsis.circle",
    ion: "ellipsis-horizontal-circle-outline",
  },
  star: { sf: "star.fill", ion: "star" },
  "star-outline": { sf: "star", ion: "star-outline" },
  notifications: { sf: "bell.fill", ion: "notifications" },
  "notifications-outline": { sf: "bell", ion: "notifications-outline" },
  pricetag: { sf: "tag.fill", ion: "pricetag" },
  "pricetag-outline": { sf: "tag", ion: "pricetag-outline" },
  "lock-closed": { sf: "lock.fill", ion: "lock-closed" },
  "lock-closed-outline": { sf: "lock", ion: "lock-closed-outline" },
  add: { sf: "plus", ion: "add" },
  "copy-outline": { sf: "doc.on.doc", ion: "copy-outline" },
  refresh: { sf: "arrow.clockwise", ion: "refresh" },
  search: { sf: "magnifyingglass", ion: "search" },
  close: { sf: "xmark.circle.fill", ion: "close-circle" },
  "close-outline": { sf: "xmark", ion: "close" },
  check: { sf: "checkmark", ion: "checkmark" },
  chevron: { sf: "chevron.left", ion: "chevron-back" },
  "chevron-down": { sf: "chevron.down", ion: "chevron-down" },
  info: { sf: "info.circle", ion: "information-circle-outline" },
  sparkles: { sf: "sparkles", ion: "sparkles-outline" },
};

export function AppIcon({
  name,
  size = 20,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const iconColor = color || t.text;
  const mapped = iconMapping[name];

  if (Platform.OS === "ios" && mapped?.sf) {
    return (
      <View style={style}>
        <SymbolView
          name={mapped.sf}
          size={size}
          tintColor={iconColor}
          resizeMode="scaleAspectFit"
        />
      </View>
    );
  }

  const ionName =
    mapped?.ion || (name in Ionicons.glyphMap ? (name as keyof typeof Ionicons.glyphMap) : "ellipse-outline");
  return (
    <View style={style}>
      <Ionicons name={ionName} size={size} color={iconColor} />
    </View>
  );
}

export function Label({
  children,
  muted = false,
  secondary = false,
  tertiary = false,
  size = 15,
  weight = "400",
  tabular = false,
  accent = false,
  green = false,
  red = false,
  amber = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  size?: number;
  weight?: TextStyle["fontWeight"];
  tabular?: boolean;
  accent?: boolean;
  green?: boolean;
  red?: boolean;
  amber?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();

  let textColor = t.text;
  if (accent) textColor = t.accent;
  else if (green) textColor = t.green;
  else if (red) textColor = t.red;
  else if (amber) textColor = t.amberText;
  else if (tertiary) textColor = t.textTertiary;
  else if (secondary || muted) textColor = t.textSecondary;

  return (
    <Text
      style={[
        {
          color: textColor,
          fontSize: size,
          fontWeight: weight,
          textAlign: "right",
          writingDirection: "rtl",
          lineHeight: Math.round(size * 1.45),
          fontVariant: tabular ? ["tabular-nums"] : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  elevated = false,
  style,
}: {
  children: React.ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? t.surfaceElevated : t.surface,
          borderRadius: radii.card,
          padding: 18,
          gap: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Glass({
  children,
  glassEffectStyle = "regular",
  interactive = false,
  tintColor,
  radius = radii.card,
  style,
}: {
  children: React.ReactNode;
  glassEffectStyle?: "regular" | "clear" | "none";
  interactive?: boolean;
  tintColor?: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();

  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        isInteractive={interactive}
        tintColor={tintColor}
        colorScheme={t.dark ? "dark" : "light"}
        style={[
          {
            borderRadius: radius,
            overflow: "hidden",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.glassRim,
          },
          style,
        ]}
      >
        {children}
      </GlassView>
    );
  }

  // Fallback for Android, Web, and older iOS
  const blurTint = t.dark
    ? "systemChromeMaterialDark"
    : "systemChromeMaterialLight";
  const bgFallback =
    glassEffectStyle === "clear"
      ? t.glassClear
      : glassEffectStyle === "none"
        ? "transparent"
        : t.glassRegular;

  return (
    <BlurView
      intensity={t.dark ? 45 : 70}
      tint={blurTint}
      style={[
        {
          borderRadius: radius,
          overflow: "hidden",
          backgroundColor: bgFallback,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.glassRim,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

export function GlassContainer({
  children,
  spacing: glassSpacing = 8,
  style,
}: {
  children: React.ReactNode;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return (
      <NativeGlassContainer spacing={glassSpacing} style={style}>
        {children}
      </NativeGlassContainer>
    );
  }
  return <View style={style}>{children}</View>;
}

export function GlassButton({
  title,
  onPress,
  icon,
  variant = "regular",
  size = "medium",
  disabled = false,
  loading = false,
  quiet = false,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: "prominent" | "regular" | "secondary" | "quiet";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  quiet?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  const { haptic } = useApp();
  const scale = useRef(new Animated.Value(1)).current;

  const actualVariant = quiet ? "quiet" : variant;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 6,
    }).start();
  };

  const minHeight = size === "small" ? 36 : size === "large" ? 54 : 46;
  const paddingH = size === "small" ? 12 : size === "large" ? 22 : 16;
  const fontSize = size === "small" ? 13 : size === "large" ? 16 : 14;
  const buttonRadius = size === "small" ? 12 : radii.control;

  let btnBackground: string = t.glassRegular;
  let labelColor: string = t.text;
  let iconColor: string = t.text;

  if (actualVariant === "prominent") {
    btnBackground = t.accent;
    labelColor = "#FFFFFF";
    iconColor = "#FFFFFF";
  } else if (actualVariant === "secondary") {
    btnBackground = t.raised;
    labelColor = t.text;
    iconColor = t.accent;
  } else if (actualVariant === "quiet") {
    btnBackground = "transparent";
    labelColor = t.accent;
    iconColor = t.accent;
  } else {
    // regular Liquid Glass
    btnBackground = t.glassRegular;
    labelColor = t.accent;
    iconColor = t.accent;
  }

  const content = (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        icon && <AppIcon name={icon} size={fontSize + 3} color={iconColor} />
      )}
      <Label
        size={fontSize}
        weight="600"
        style={[
          {
            color: labelColor,
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {title}
      </Label>
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          haptic();
          onPress();
        }}
        style={{
          minHeight,
          paddingHorizontal: paddingH,
          borderRadius: buttonRadius,
          backgroundColor: actualVariant === "regular" ? undefined : btnBackground,
          opacity: disabled ? 0.4 : 1,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: actualVariant === "quiet" ? 0 : StyleSheet.hairlineWidth,
          borderColor: actualVariant === "prominent" ? "transparent" : t.glassRim,
          overflow: "hidden",
        }}
      >
        {actualVariant === "regular" ? (
          <Glass
            glassEffectStyle="regular"
            interactive
            radius={buttonRadius}
            style={{
              position: "absolute",
              inset: 0,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: paddingH,
            }}
          >
            {content}
          </Glass>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Button(props: {
  title: string;
  onPress: () => void;
  icon?: string;
  quiet?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <GlassButton
      title={props.title}
      onPress={props.onPress}
      icon={props.icon}
      variant={props.quiet ? "quiet" : "regular"}
      disabled={props.disabled}
      style={props.style}
    />
  );
}

export function GlassIconButton({
  icon,
  onPress,
  size = 40,
  color,
  tint,
  active = false,
  activeColor,
  accessibilityLabel,
  style,
}: {
  icon: string;
  onPress: () => void;
  size?: number;
  color?: string;
  tint?: string;
  active?: boolean;
  activeColor?: string;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const { haptic } = useApp();
  const iconColor = active ? activeColor || t.accent : color || t.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          justifyContent: "center",
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Glass
        glassEffectStyle="regular"
        interactive
        radius={size / 2}
        tintColor={active ? tint || t.accentGlass : undefined}
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AppIcon name={icon} size={Math.round(size * 0.48)} color={iconColor} />
      </Glass>
    </Pressable>
  );
}

export function GlassSearchBar({
  value,
  onChangeText,
  placeholder = "جستجو در بازار ارز…",
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  const t = useTheme();

  return (
    <Glass
      glassEffectStyle="regular"
      radius={radii.pill}
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        paddingHorizontal: 14,
        height: 44,
        gap: 8,
      }}
    >
      <AppIcon name="search" size={18} color={t.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.textTertiary}
        style={{
          flex: 1,
          color: t.text,
          fontSize: 15,
          textAlign: "right",
          writingDirection: "rtl",
          paddingVertical: 0,
        }}
        clearButtonMode="never"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="پاک کردن جستجو"
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
          hitSlop={8}
        >
          <AppIcon name="close" size={18} color={t.textTertiary} />
        </Pressable>
      )}
    </Glass>
  );
}

export function GlassSegmentedControl<T extends string>({
  values,
  value,
  onChange,
  label,
  style,
}: {
  values: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label?: (v: T) => string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const { haptic } = useApp();

  return (
    <Glass
      glassEffectStyle="clear"
      radius={radii.control}
      style={[
        {
          flexDirection: "row-reverse",
          padding: 3,
          backgroundColor: t.dark ? "rgba(22, 24, 30, 0.65)" : "rgba(225, 230, 238, 0.7)",
          gap: 2,
        },
        style,
      ]}
    >
      {values.map((item) => {
        const isSelected = item === value;
        const segmentRadius = concentricRadius(radii.control, 3, 8);
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (!isSelected) {
                haptic();
                onChange(item);
              }
            }}
            style={{
              flex: 1,
              minHeight: 32,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 8,
              borderRadius: segmentRadius,
              backgroundColor: isSelected
                ? t.dark
                  ? "rgba(60, 66, 80, 0.95)"
                  : "#FFFFFF"
                : "transparent",
              shadowColor: isSelected ? "#000000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isSelected ? 0.15 : 0,
              shadowRadius: 2,
              elevation: isSelected ? 1 : 0,
            }}
          >
            <Label
              size={12}
              weight={isSelected ? "600" : "500"}
              style={{
                color: isSelected ? t.text : t.textSecondary,
                textAlign: "center",
              }}
            >
              {label ? label(item) : item}
            </Label>
          </Pressable>
        );
      })}
    </Glass>
  );
}

export function Choices<T extends string>({
  values,
  value,
  onChange,
  label,
}: {
  values: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label?: (v: T) => string;
}) {
  return (
    <GlassSegmentedControl
      values={values}
      value={value}
      onChange={onChange}
      label={label}
    />
  );
}

export function usePrice() {
  const { user } = useApp();
  return (value: number | null | undefined, digits = 0) =>
    value == null
      ? "—"
      : formatNumber(
          value * (user.settings.unit === "IRR" ? 10 : 1),
          user.settings.persian,
          digits,
        );
}

export function Price({
  value,
  large = false,
  digits,
}: {
  value: number | null | undefined;
  large?: boolean;
  digits?: number;
}) {
  const fmt = usePrice();
  const { user } = useApp();
  const unitLabel = names[user.settings.unit];

  return (
    <View style={{ gap: 2, alignItems: "flex-end" }}>
      <Label
        size={large ? 38 : 22}
        weight="700"
        tabular
        style={{
          writingDirection: "ltr",
          letterSpacing: -0.5,
        }}
      >
        {fmt(value, digits ?? (large ? 0 : 0))}
      </Label>
      <Label secondary size={11}>
        {unitLabel}
      </Label>
    </View>
  );
}

export function MarketChangeBadge({
  value,
  size = "medium",
}: {
  value: number | null | undefined;
  size?: "small" | "medium" | "large";
}) {
  const t = useTheme();
  const { user } = useApp();

  const isZero = value === 0 || value == null;
  const isPositive = !isZero && (value ?? 0) > 0;
  const isNegative = !isZero && (value ?? 0) < 0;

  let bgTint: string = t.surfaceElevated;
  let textColor: string = t.textSecondary;

  if (isPositive) {
    bgTint = t.greenGlass;
    textColor = t.greenText;
  } else if (isNegative) {
    bgTint = t.redGlass;
    textColor = t.redText;
  }

  const fontSize = size === "small" ? 11 : size === "large" ? 14 : 12;
  const paddingH = size === "small" ? 6 : size === "large" ? 12 : 8;
  const paddingV = size === "small" ? 2 : size === "large" ? 6 : 4;

  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: bgTint,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        borderRadius: radii.pill,
        gap: 3,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isPositive
          ? t.green
          : isNegative
            ? t.red
            : t.line,
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: fontSize - 2,
          fontWeight: "700",
        }}
      >
        {isPositive ? "▲" : isNegative ? "▼" : "•"}
      </Text>
      <Label
        size={fontSize}
        weight="600"
        tabular
        style={{
          color: textColor,
          writingDirection: "ltr",
          lineHeight: fontSize * 1.3,
        }}
      >
        {value == null
          ? "—"
          : `${isPositive ? "+" : ""}${formatNumber(value, user.settings.persian, 2)}٪`}
      </Label>
    </View>
  );
}

export function ChangeBadge({ value }: { value: number | null | undefined }) {
  return <MarketChangeBadge value={value} />;
}

export function SpreadBar({
  current,
  low,
  high,
}: {
  current?: number | null;
  low?: number | null;
  high?: number | null;
}) {
  const t = useTheme();
  const fmt = usePrice();

  if (
    current == null ||
    low == null ||
    high == null ||
    high <= low ||
    current < low ||
    current > high
  ) {
    return null;
  }

  const fraction = Math.max(0, Math.min(1, (current - low) / (high - low)));

  return (
    <View style={{ gap: 4, width: "100%" }}>
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Label secondary size={10}>
          بالاترین: {fmt(high, 0)}
        </Label>
        <Label secondary size={10}>
          پایین‌ترین: {fmt(low, 0)}
        </Label>
      </View>
      <View
        style={{
          height: 4,
          backgroundColor: t.raised,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.round(fraction * 100)}%`,
            backgroundColor: t.accent,
            borderRadius: 2,
            alignSelf: "flex-end",
          }}
        />
      </View>
    </View>
  );
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  AED: "د.إ",
  IQD: "ع.د",
  USDT: "₮",
  IRT: "ت",
  IRR: "﷼",
};

export function CurrencyRow({
  code,
  quote,
  featured = false,
  showFavorite = false,
}: {
  code: Currency;
  quote?: CurrencyQuote;
  featured?: boolean;
  showFavorite?: boolean;
}) {
  const t = useTheme();
  const app = useApp();
  const isFavorite = app.user.watchlist.includes(code);

  const toggleFavorite = () => {
    app.updateUser((u) => ({
      ...u,
      watchlist: isFavorite
        ? u.watchlist.filter((c) => c !== code)
        : [...u.watchlist, code],
    }));
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`جزئیات ${names[code]}`}
      onPress={() => router.push(`/currency/${code}`)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Card
        elevated={featured}
        style={{
          padding: featured ? 20 : 16,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Right side in RTL: Currency icon, name and code */}
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.control,
                backgroundColor: t.dark
                  ? "rgba(40, 44, 56, 0.7)"
                  : "rgba(228, 233, 242, 0.85)",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.glassRim,
              }}
            >
              <Text
                style={{
                  color: t.accent,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                {currencySymbols[code] || code.slice(0, 2)}
              </Text>
            </View>

            <View style={{ gap: 2 }}>
              <View
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Label size={16} weight="700">
                  {names[code]}
                </Label>
                {isFavorite && (
                  <Text style={{ color: "#FFD60A", fontSize: 12 }}>★</Text>
                )}
              </View>
              <Label secondary size={11}>
                {code} · بازار آزاد ایران
              </Label>
            </View>
          </View>

          {/* Left side in RTL: Price and change badge */}
          <View style={{ alignItems: "flex-start", gap: 4 }}>
            <Price value={quote?.priceToman} large={featured} />
            <MarketChangeBadge value={quote?.changePercent} size="small" />
          </View>
        </View>

        {/* Daily spread indicator */}
        {quote && (
          <SpreadBar
            current={quote.priceToman}
            low={quote.lowToman}
            high={quote.highToman}
          />
        )}

        {featured && quote && (
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 4,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: t.lineSubtle,
            }}
          >
            <Label tertiary size={11}>
              زمان منبع · {quote.sourceTimeLabel}
            </Label>
            <Label tertiary size={11}>
              TGJU (تومان)
            </Label>
          </View>
        )}

        {showFavorite && (
          <View style={{ alignItems: "flex-start", marginTop: 4 }}>
            <GlassButton
              title={isFavorite ? "حذف از دنبال‌شده‌ها" : "افزودن به دنبال‌شده‌ها"}
              icon={isFavorite ? "star" : "star-outline"}
              variant="quiet"
              size="small"
              onPress={toggleFavorite}
            />
          </View>
        )}
      </Card>
    </Pressable>
  );
}

export function CurrencyCard(props: {
  code: Currency;
  quote?: CurrencyQuote;
  showFavorite?: boolean;
}) {
  return <CurrencyRow {...props} featured />;
}

export function MarketStatus() {
  const app = useApp();
  const t = useTheme();

  const statusColor = !app.online
    ? t.red
    : app.stale
      ? t.amber
      : t.green;

  const statusLabel = app.busy
    ? "در حال به‌روزرسانی نرخ‌ها…"
    : !app.online
      ? "آفلاین · نمایش نرخ‌های ذخیره‌شده"
      : app.stale
        ? "متصل · تازگی منبع تأیید نشده"
        : "متصل · نرخ زنده";

  return (
    <Glass
      glassEffectStyle="clear"
      radius={radii.control}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 4,
      }}
    >
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{ flexDirection: "row-reverse", alignItems: "center", gap: 7 }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColor,
            }}
          />
          <Label size={12} weight="600">
            {statusLabel}
          </Label>
        </View>

        {app.busy ? (
          <ActivityIndicator size="small" color={t.accent} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تازه‌سازی نرخ‌ها"
            onPress={() => void app.refresh(true)}
            hitSlop={8}
          >
            <AppIcon name="refresh" size={14} color={t.textSecondary} />
          </Pressable>
        )}
      </View>

      {app.snapshot && (
        <Label tertiary size={10}>
          آخرین دریافت:{" "}
          {new Date(app.snapshot.fetchedAt).toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </Label>
      )}

      {app.error && (
        <Label red size={11}>
          {app.error}
        </Label>
      )}
    </Glass>
  );
}

/** Top Hero Area for Home Screen: Live USD benchmark, sparkline, status and quick actions */
export function MarketHero() {
  const app = useApp();
  const t = useTheme();
  const usd = app.snapshot?.quotes.find((q) => q.currency === "USD");
  const isPositive = (usd?.changePercent ?? 0) >= 0;

  // Mock mini sparkline points for aesthetic rhythm
  const sparklineData = usd
    ? isPositive
      ? "5,35 25,32 50,34 75,28 100,24 125,20 150,14 175,10 195,5"
      : "5,10 25,12 50,15 75,20 100,22 125,28 150,30 175,34 195,36"
    : "5,20 50,20 100,20 150,20 195,20";

  return (
    <Card elevated style={{ padding: 20, gap: 16 }}>
      {/* Top row: Benchmark label + status pill */}
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ gap: 2 }}>
          <Label size={12} weight="700" style={{ color: t.accent }}>
            شاخص اصلی بازار آزاد
          </Label>
          <Label size={20} weight="700">
            دلار آمریکا · USD
          </Label>
        </View>

        <MarketStatus />
      </View>

      {/* Main USD rate & sparkline row */}
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Right side: Price and change badge */}
        <View style={{ gap: 6, alignItems: "flex-end" }}>
          <Price value={usd?.priceToman} large />
          <MarketChangeBadge value={usd?.changePercent} size="medium" />
        </View>

        {/* Left side: Mini sparkline visualization */}
        <View style={{ width: 110, height: 42, justifyContent: "center" }}>
          <Svg width={110} height={42} viewBox="0 0 200 42">
            <Defs>
              <LinearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0%"
                  stopColor={isPositive ? t.green : t.red}
                  stopOpacity={0.4}
                />
                <Stop
                  offset="100%"
                  stopColor={isPositive ? t.green : t.red}
                  stopOpacity={0}
                />
              </LinearGradient>
            </Defs>
            <Polyline
              points={sparklineData}
              fill="none"
              stroke={isPositive ? t.green : t.red}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>

      {/* Today's spread */}
      {usd && (
        <SpreadBar
          current={usd.priceToman}
          low={usd.lowToman}
          high={usd.highToman}
        />
      )}

      {/* Quick Actions Bar */}
      <View
        style={{
          flexDirection: "row-reverse",
          gap: 8,
          paddingTop: 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.lineSubtle,
        }}
      >
        <GlassButton
          title="مبدل سریع"
          icon="swap-horizontal"
          size="small"
          variant="regular"
          style={{ flex: 1 }}
          onPress={() => router.push("/converter")}
        />
        <GlassButton
          title="هشدار نرخ"
          icon="notifications-outline"
          size="small"
          variant="regular"
          style={{ flex: 1 }}
          onPress={() => router.push("/alerts")}
        />
        <GlassButton
          title="نرخ من"
          icon="pricetag-outline"
          size="small"
          variant="regular"
          style={{ flex: 1 }}
          onPress={() => router.push("/custom-rates")}
        />
      </View>
    </Card>
  );
}

export function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { title: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <View style={{ gap: 2 }}>
          <Label size={20} weight="700">
            {title}
          </Label>
          {subtitle && (
            <Label secondary size={12}>
              {subtitle}
            </Label>
          )}
        </View>
        {action && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.title}
            onPress={action.onPress}
          >
            <Label size={13} weight="600" accent>
              {action.title}
            </Label>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

export function AmountInput({
  label,
  value,
  onChangeText,
  placeholder = "۰",
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  unit?: string;
}) {
  const t = useTheme();

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Label secondary size={13} weight="600">
          {label}
        </Label>
        {unit && (
          <Label tertiary size={11}>
            {unit}
          </Label>
        )}
      </View>
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          backgroundColor: t.dark ? "rgba(25, 28, 36, 0.75)" : "rgba(235, 239, 246, 0.8)",
          borderRadius: radii.control,
          paddingHorizontal: 16,
          minHeight: 56,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.line,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textTertiary}
          keyboardType="decimal-pad"
          style={{
            flex: 1,
            color: t.text,
            fontSize: 24,
            fontWeight: "600",
            textAlign: "right",
            writingDirection: "rtl",
            fontVariant: ["tabular-nums"],
            paddingVertical: 10,
          }}
        />
        {value.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="پاک کردن مقدار"
            onPress={() => onChangeText("")}
            hitSlop={8}
          >
            <AppIcon name="close" size={18} color={t.textTertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  icon = "analytics-outline",
  action,
}: {
  title: string;
  description: string;
  icon?: string;
  action?: { title: string; onPress: () => void };
}) {
  const t = useTheme();

  return (
    <Card style={{ alignItems: "center", paddingVertical: 36, gap: 12 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: t.dark ? "rgba(40, 44, 56, 0.6)" : "rgba(230, 235, 245, 0.7)",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.glassRim,
        }}
      >
        <AppIcon name={icon} size={28} color={t.accent} />
      </View>
      <Label size={18} weight="700">
        {title}
      </Label>
      <Label
        secondary
        size={13}
        style={{ textAlign: "center", maxWidth: 280 }}
      >
        {description}
      </Label>
      {action && (
        <GlassButton
          title={action.title}
          onPress={action.onPress}
          variant="regular"
          size="small"
          style={{ marginTop: 8 }}
        />
      )}
    </Card>
  );
}

export function Screen({
  title,
  eyebrow,
  children,
  refresh = false,
  trailing,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  refresh?: boolean;
  trailing?: React.ReactNode;
}) {
  const t = useTheme();
  const app = useApp();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 18,
          paddingBottom: 130,
          gap: 16,
          maxWidth: 720,
          width: "100%",
          alignSelf: "center",
        }}
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={app.busy}
              onRefresh={() => void app.refresh(true)}
              tintColor={t.accent}
              colors={[t.accent]}
            />
          ) : undefined
        }
      >
        {/* Apple iOS Large Title Header */}
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 8,
            marginBottom: 4,
          }}
        >
          <View style={{ gap: 2 }}>
            {eyebrow && (
              <Label secondary size={12} weight="600" accent>
                {eyebrow}
              </Label>
            )}
            <Label size={32} weight="700" style={{ letterSpacing: -0.4 }}>
              {title}
            </Label>
          </View>

          {trailing}
        </View>

        {app.storageError && (
          <Card style={{ borderColor: t.red }}>
            <Label red size={13}>
              {app.storageError}
            </Label>
          </Card>
        )}

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
