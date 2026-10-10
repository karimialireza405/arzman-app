/**
 * Floating glass tab bar for Android and the web.
 *
 * iOS uses the system UITabBarController (the real Liquid Glass lens). On
 * Android the native tabs are Material's bottom navigation, which follows the
 * *device* theme rather than ArzMan's own light/dark setting: it stayed black
 * in light mode, flat and edge to edge. This bar is drawn by ArzMan instead, so
 * it always matches the chosen appearance:
 * - a floating pill clear of the screen edges and the gesture area;
 * - a frosted surface: real backdrop blur on the web; on Android a near-opaque
 *   tinted fill (Android's blur needs a target view wrapped around every
 *   screen, which is not worth the risk for a navigation bar);
 * - a hairline rim, a specular top edge and a soft shadow for depth;
 * - a selection capsule that springs between tabs (instant under Reduce Motion).
 *
 * Tabs are declared in mirrored order by the layouts, so خانه sits on the right.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { Tabs } from "expo-router";
import { curve, persianText } from "../design-system";
import { AppIcon } from "./primitives";
import { useFeedback, useReduceMotion, useTheme } from "./theme";

/** Props the navigator passes to `tabBar`, derived from the public Tabs API. */
type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export interface TabSpec {
  name: string;
  title: string;
  icon: string;
  activeIcon: string;
}

export const TAB_BAR = {
  height: 64,
  radius: 32,
  sideInset: 16,
  padding: 6,
  /** Above the gesture/home indicator, never closer than 10pt to the edge. */
  bottomOffset: (insetBottom: number) => Math.max(insetBottom, 10) + 4,
};

/** Space a scrolling screen must leave at its end so nothing hides under the bar. */
export const tabBarClearance = (insetBottom: number) =>
  TAB_BAR.height + TAB_BAR.bottomOffset(insetBottom) + 12;

/** Provided by the Android/web tab layouts; 0 under the native iOS tab bar. */
export const TabBarClearanceContext = createContext(0);
export const useTabBarClearance = () => useContext(TabBarClearanceContext);

export function FloatingTabBar({
  state,
  navigation,
  tabs,
}: Pick<TabBarProps, "state" | "navigation"> & { tabs: TabSpec[] }) {
  const t = useTheme();
  const feedback = useFeedback();
  const reducedMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const byName = new Map(tabs.map((tab) => [tab.name, tab]));

  // On Android the window resizes for the keyboard; a floating bar would ride
  // up over the converter's input. Step aside while typing, as the system does.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboard(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboard(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const count = state.routes.length;
  const itemWidth = width > 0 ? (width - TAB_BAR.padding * 2) / count : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (itemWidth <= 0) return;
    const target = TAB_BAR.padding + state.index * itemWidth;
    // The first placement is instant: on launch the capsule is simply there.
    if (!placed.current || reducedMotion) {
      placed.current = true;
      x.value = target;
    } else {
      x.value = withSpring(target, { damping: 19, stiffness: 230, mass: 0.9 });
    }
  }, [state.index, itemWidth, reducedMotion, x]);
  const capsule = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  if (keyboard) return null;

  const web = Platform.OS === "web";
  const fill = t.dark
    ? web
      ? "rgba(30, 31, 44, 0.62)"
      : "rgba(26, 27, 39, 0.94)"
    : web
      ? "rgba(255, 255, 255, 0.66)"
      : "rgba(255, 255, 255, 0.96)";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: TAB_BAR.sideInset,
        right: TAB_BAR.sideInset,
        bottom: TAB_BAR.bottomOffset(insets.bottom),
        height: TAB_BAR.height,
        maxWidth: 520,
        alignSelf: "center",
        borderRadius: TAB_BAR.radius,
        boxShadow: t.dark
          ? "0 12px 32px rgba(0, 0, 0, 0.55)"
          : "0 10px 30px rgba(52, 36, 140, 0.16), 0 2px 6px rgba(52, 36, 140, 0.08)",
      }}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: TAB_BAR.radius,
            borderCurve: curve.continuous,
            overflow: "hidden",
            backgroundColor: fill,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.dark
              ? "rgba(255, 255, 255, 0.14)"
              : "rgba(28, 22, 70, 0.10)",
          },
          // React Native's types don't know backdrop-filter; react-native-web
          // passes it through to CSS.
          web
            ? ({
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
              } as object)
            : null,
        ]}
      >
        {/* Specular top edge: the light catching the rim of the glass. */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: TAB_BAR.radius,
            right: TAB_BAR.radius,
            height: 1,
            backgroundColor: t.dark
              ? "rgba(255, 255, 255, 0.22)"
              : "rgba(255, 255, 255, 1)",
          }}
        />
      </View>

      <View
        role="tablist"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, flexDirection: "row", padding: TAB_BAR.padding }}
      >
        {itemWidth > 0 ? (
          <Reanimated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: TAB_BAR.padding,
                bottom: TAB_BAR.padding,
                left: 0,
                width: itemWidth,
                borderRadius: TAB_BAR.radius - TAB_BAR.padding,
                borderCurve: curve.continuous,
                backgroundColor: t.accentFill,
                borderWidth: 1,
                borderColor: t.dark
                  ? "rgba(167, 139, 250, 0.28)"
                  : "rgba(109, 40, 217, 0.14)",
              },
              capsule,
            ]}
          />
        ) : null}

        {state.routes.map((route, index) => {
          const tab = byName.get(route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? t.accent : t.textSecondary;
          const onPress = () => {
            feedback.tap();
            // tabPress lets a screen react to (or veto) the switch, like the default bar.
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented)
              navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              role="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.title}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              android_ripple={{
                color: t.accentFill,
                borderless: true,
                radius: 30,
              }}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                opacity: pressed && Platform.OS !== "android" ? 0.7 : 1,
              })}
            >
              <AppIcon
                name={focused ? tab.activeIcon : tab.icon}
                size={23}
                color={color}
              />
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={persianText(
                  {
                    color,
                    fontSize: 11,
                    fontWeight: focused ? "700" : "500",
                    textAlign: "center",
                    writingDirection: "rtl",
                    // The bar has a fixed height; keep the line at the glyphs'
                    // measured Persian height (≥1.5625×), not more.
                    lineHeight: 18,
                  },
                  tab.title,
                )}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
