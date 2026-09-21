/**
 * Controls — buttons, icon buttons, segmented controls, search.
 *
 * Every rule here traces to an official Apple source:
 *  - "a button needs a hit region of at least 44x44 pt"             (Buttons)
 *  - "Always include a press state for a custom button."            (Buttons)
 *  - "Keep the number of prominent buttons to one or two per view." (Buttons)
 *  - "prefer the rounded-rectangle shape in a vertical stack of buttons
 *     and prefer the capsule shape in a horizontal row of buttons." (Buttons · iOS)
 *  - "Aim for no more than about five segments on iPhone."          (Segmented controls)
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { curve, radii, spacing, springs } from "../design-system";
import { AppIcon, Label } from "./primitives";
import { Glass } from "./surfaces";
import { useFeedback, usePressFeedback, useReduceMotion, useTheme } from "./theme";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export type ButtonVariant =
  | "prominent"
  | "tinted"
  | "bordered"
  | "glass"
  | "plain"
  | "destructive"
  /** Legacy names kept so partially migrated screens keep working. */
  | "regular"
  | "secondary"
  | "quiet";

export type ButtonSize = "small" | "medium" | "large";

/** Resolves both the Apple-aligned names and the legacy variant names. */
function resolveVariant(
  variant: ButtonVariant,
): Exclude<ButtonVariant, "regular" | "secondary" | "quiet"> {
  if (variant === "regular") return "glass";
  if (variant === "secondary") return "tinted";
  if (variant === "quiet") return "plain";
  return variant;
}

export const buttonMetrics: Record<
  ButtonSize,
  { height: number; radius: number; padding: number; fontSize: number }
> = {
  // 50pt is Apple's large control height for a full-width primary action.
  large: { height: 50, radius: 14, padding: spacing.md, fontSize: 17 },
  medium: { height: 44, radius: 12, padding: spacing.sm, fontSize: 17 },
  // Compact inline control: 34pt visual, 44pt hit region via hitSlop.
  small: { height: 34, radius: 10, padding: spacing.xs, fontSize: 14 },
};

/**
 * Primary control component.
 *
 * One component covers Apple's semantic button styles so a screen can express
 * action hierarchy by *style* instead of by ad-hoc size or color:
 *
 *  prominent   → default action of the view (accent fill)
 *  tinted      → secondary action that still reads as tappable
 *  bordered    → neutral stroke, used next to content
 *  glass       → chrome action living on a Liquid Glass surface
 *  plain       → inline text action (Apple's lower-emphasis style)
 *  destructive → irreversible actions only
 */
export function Button({
  title,
  onPress,
  icon,
  variant = "glass",
  size = "medium",
  shape,
  disabled = false,
  loading = false,
  fullWidth = false,
  quiet = false,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Defaults to rounded; use capsule for buttons in a horizontal row. */
  shape?: "rounded" | "capsule";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Legacy flag: renders the quiet (plain) style. */
  quiet?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  const feedback = useFeedback();
  const press = usePressFeedback(0.97);
  const resolved = resolveVariant(quiet ? "quiet" : variant);
  const m = buttonMetrics[size];
  const corner = shape === "capsule" ? radii.pill : m.radius;
  const inactive = disabled || loading;

  let background: string | undefined;
  let borderColor = "transparent";
  let labelColor = t.text;
  let iconColor = t.text;

  if (resolved === "prominent") {
    background = t.accent;
    labelColor = "#FFFFFF";
    iconColor = "#FFFFFF";
  } else if (resolved === "destructive") {
    background = t.red;
    labelColor = "#FFFFFF";
    iconColor = "#FFFFFF";
  } else if (resolved === "tinted") {
    background = t.accentFill;
    labelColor = t.accent;
    iconColor = t.accent;
  } else if (resolved === "bordered") {
    background = "transparent";
    borderColor = t.separator;
    labelColor = t.accent;
    iconColor = t.accent;
  } else if (resolved === "plain") {
    background = "transparent";
    labelColor = t.accent;
    iconColor = t.accent;
  } else {
    // Liquid Glass chrome button — label keeps the primary vibrancy color.
    labelColor = t.text;
    iconColor = t.text;
  }

  const content = (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xxs,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : icon ? (
        <AppIcon
          name={icon}
          size={size === "small" ? 16 : 18}
          color={iconColor}
          weight="semibold"
        />
      ) : null}
      <Label
        numberOfLines={1}
        style={[
          {
            color: labelColor,
            fontSize: m.fontSize,
            fontWeight: "600",
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
    <Animated.View
      style={[press.style, fullWidth ? { width: "100%" } : null, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={() => {
          if (inactive) return;
          feedback.press();
          press.handlers.onPressIn();
        }}
        onPressOut={press.handlers.onPressOut}
        onPress={() => {
          if (inactive) return;
          feedback.tap();
          onPress();
        }}
        hitSlop={
          size === "small" ? { top: 5, bottom: 5, left: 6, right: 6 } : undefined
        }
        style={{
          minHeight: m.height,
          paddingHorizontal: m.padding,
          borderRadius: corner,
          borderCurve: curve.continuous,
          borderWidth: resolved === "bordered" ? 1 : 0,
          borderColor,
          backgroundColor: background,
          opacity: inactive ? 0.38 : 1,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {resolved === "glass" ? (
          <Glass
            glassEffectStyle="regular"
            interactive
            radius={corner}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : null}
        {content}
      </Pressable>
    </Animated.View>
  );
}

/** Convenience alias used by older screens. */
export const GlassButton = Button;

/**
 * Compact circular control for chrome (toolbar actions, favorite toggles,
 * inline clear/refresh). The visible circle is 36pt; the hit region is 44pt,
 * per HIG · Buttons.
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 36,
  color,
  active = false,
  activeColor,
  variant = "glass",
  style,
}: {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: string;
  active?: boolean;
  activeColor?: string;
  variant?: "glass" | "plain";
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const feedback = useFeedback();
  const press = usePressFeedback(0.94);
  const iconColor = active
    ? (activeColor ?? t.accent)
    : (color ?? t.textSecondary);

  return (
    <Animated.View style={[press.style, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: active }}
        onPressIn={() => {
          feedback.press();
          press.handlers.onPressIn();
        }}
        onPressOut={press.handlers.onPressOut}
        onPress={() => {
          feedback.tap();
          onPress();
        }}
        hitSlop={8}
        style={{
          width: size,
          height: size,
          borderRadius: radii.pill,
          borderCurve: curve.continuous,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          backgroundColor: variant === "plain" ? "transparent" : undefined,
        }}
      >
        {variant === "glass" ? (
          <Glass
            glassEffectStyle="regular"
            interactive
            tintColor={active ? t.accentFill : undefined}
            radius={radii.pill}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : null}
        <AppIcon
          name={icon}
          size={Math.round(size * 0.5)}
          color={iconColor}
          weight={active ? "semibold" : "medium"}
        />
      </Pressable>
    </Animated.View>
  );
}

/** Legacy alias. */
export const GlassIconButton = IconButton;

/**
 * Segmented control.
 *
 * Apple guidance: group closely related choices, keep segment widths equal,
 * never exceed ~5 segments on iPhone, and never mix actions with state.
 * The selection indicator travels with a short spring (HIG · Motion).
 */
export function SegmentedControl<T extends string | number>({
  values,
  value,
  onChange,
  label,
  size = "regular",
  style,
}: {
  values: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label?: (next: T) => string;
  size?: "regular" | "compact";
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const feedback = useFeedback();
  const reduced = useReduceMotion();
  const [width, setWidth] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;

  const height = size === "compact" ? 30 : 34;
  const inset = 2;
  const count = Math.max(1, values.length);
  const segmentWidth = Math.max(0, (width - inset * 2) / count);
  const index = Math.max(0, values.indexOf(value));

  useEffect(() => {
    const target = -index * segmentWidth;
    if (reduced) {
      offset.setValue(target);
      return;
    }
    Animated.spring(offset, {
      toValue: target,
      useNativeDriver: true,
      damping: springs.tab.damping,
      stiffness: springs.tab.stiffness,
      mass: springs.tab.mass,
    }).start();
  }, [index, offset, reduced, segmentWidth]);

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[
        {
          height,
          borderRadius: radii.controlSmall,
          borderCurve: curve.continuous,
          backgroundColor: t.fillSecondary,
          padding: inset,
          flexDirection: "row-reverse",
          alignItems: "stretch",
          overflow: "hidden",
        },
        style,
      ]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: inset,
            bottom: inset,
            right: inset,
            width: segmentWidth,
            borderRadius: radii.controlSmall - 2,
            borderCurve: curve.continuous,
            backgroundColor: t.dark ? "#636366" : "#FFFFFF",
            transform: [{ translateX: offset }],
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: t.dark ? 0.25 : 0.12,
            shadowRadius: 2,
          }}
        />
      ) : null}

      {values.map((item) => {
        const selected = item === value;
        return (
          <Pressable
            key={String(item)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              feedback.tap();
              onChange(item);
            }}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: spacing.xxs,
            }}
          >
            <Label
              size={size === "compact" ? 12 : 13}
              weight={selected ? "600" : "500"}
              numberOfLines={1}
              align="center"
              style={{ color: selected ? t.text : t.textSecondary, lineHeight: 17 }}
            >
              {label ? label(item) : item}
            </Label>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Legacy aliases. */
export const GlassSegmentedControl = SegmentedControl;

export function Choices<T extends string | number>(props: {
  values: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label?: (next: T) => string;
}) {
  return <SegmentedControl {...props} />;
}

/**
 * Search field.
 *
 * HIG · Search fields: a search field contains a Search icon, a Clear button
 * and placeholder text; "If possible, start search immediately when a person
 * types." The control is a 36pt rounded rect (10pt continuous corners) — on
 * iOS 26 it sits on the Liquid Glass chrome layer.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder = "جستجو در بازار ارز…",
  onClear,
  autoFocus = false,
  onSubmit,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        {
          minHeight: 36,
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: spacing.xxs,
          paddingHorizontal: spacing.xs,
          borderRadius: radii.controlSmall,
          borderCurve: curve.continuous,
          backgroundColor: t.fillTertiary,
          borderWidth: 1,
          borderColor: focused ? t.accent : "transparent",
        },
        style,
      ]}
    >
      <AppIcon name="search" size={16} color={t.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={{
          flex: 1,
          color: t.text,
          fontSize: 17,
          lineHeight: 22,
          textAlign: "right",
          writingDirection: "rtl",
          paddingVertical: 0,
        }}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="پاک کردن جستجو"
          hitSlop={10}
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
        >
          <AppIcon name="close" size={16} color={t.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Legacy alias. */
export const GlassSearchBar = SearchField;
