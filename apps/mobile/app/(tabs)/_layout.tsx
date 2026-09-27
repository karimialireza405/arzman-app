/**
 * Floating Liquid Glass tab bar — rendered by ArzMan, not by the navigator.
 *
 * The navigator's default bar looked right on the web but broke on iPhone, for
 * two reasons found in its source:
 *  - it anchors itself with `start: 0, end: 0`, and on iOS `start/end` override
 *    `left/right`, so the 20pt side insets were ignored and the bar ran edge to
 *    edge;
 *  - it adds `paddingBottom: insets.bottom` (34pt on Face ID iPhones) *inside*
 *    the bar, squeezing icons and labels into ~24pt so they overflowed.
 * On the web both insets are 0, which is why it looked fine there. Drawing the
 * bar ourselves makes its geometry the same everywhere.
 *
 * HIG · Tab bars: navigation only, filled symbol + label for the selection,
 * a quiet selection capsule. Tabs are mirrored for Persian (خانه on the right).
 */
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import {
  AppIcon,
  Glass,
  TAB_BAR,
  curve,
  persianText,
  useFeedback,
  useTheme,
} from "../../src/ui";

interface TabConfig {
  name: string;
  title: string;
  activeIcon: string;
  inactiveIcon: string;
}

const tabs: TabConfig[] = [
  { name: "index", title: "خانه", activeIcon: "home", inactiveIcon: "home-outline" },
  { name: "market", title: "بازار", activeIcon: "stats-chart", inactiveIcon: "stats-chart-outline" },
  { name: "converter", title: "مبدل", activeIcon: "swap-horizontal", inactiveIcon: "swap-horizontal" },
  { name: "more", title: "بیشتر", activeIcon: "more", inactiveIcon: "ellipsis-horizontal-circle-outline" },
];
const byName = new Map(tabs.map((tab) => [tab.name, tab]));

/** Props the navigator passes to `tabBar`, derived from the public Tabs API. */
type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

const PADDING = 5;

function FloatingTabBar({ state, navigation }: TabBarProps) {
  const t = useTheme();
  const feedback = useFeedback();
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  const count = state.routes.length;
  const itemWidth = barWidth > 0 ? (barWidth - PADDING * 2) / count : 0;

  // The selection capsule slides to the focused tab. Reanimated's springs
  // follow the system Reduce Motion setting.
  const x = useSharedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (itemWidth <= 0) return;
    const target = PADDING + state.index * itemWidth;
    // First placement is instant: on launch the capsule is simply under the
    // selected tab. Only a tab switch animates.
    if (!placed.current) {
      placed.current = true;
      x.value = target;
    } else {
      x.value = withSpring(target, { damping: 20, stiffness: 240 });
    }
  }, [state.index, itemWidth, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: TAB_BAR.sideInset,
        right: TAB_BAR.sideInset,
        bottom: TAB_BAR.bottomOffset(insets.bottom),
        height: TAB_BAR.height,
        borderRadius: TAB_BAR.radius,
        boxShadow: t.dark ? "0 10px 30px rgba(0, 0, 0, 0.55)" : "0 10px 30px rgba(20, 20, 60, 0.16)",
      }}
    >
      <Glass
        glassEffectStyle="regular"
        interactive
        radius={TAB_BAR.radius}
        style={StyleSheet.absoluteFill}
      />
      <View
        role="tablist"
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, flexDirection: "row", padding: PADDING }}
      >
        {itemWidth > 0 ? (
          <Reanimated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: PADDING,
                bottom: PADDING,
                left: 0,
                width: itemWidth,
                borderRadius: TAB_BAR.radius - PADDING,
                borderCurve: curve.continuous,
                backgroundColor: t.accentFill,
              },
              indicator,
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
            // Emitting tabPress lets a screen react to (or veto) the switch,
            // exactly like the default bar.
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              role="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.title}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 1 }}
            >
              <AppIcon
                name={focused ? tab.activeIcon : tab.inactiveIcon}
                size={22}
                color={color}
                weight={focused ? "semibold" : "regular"}
              />
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={persianText(
                  {
                    color,
                    fontSize: 10.5,
                    fontWeight: focused ? "700" : "500",
                    textAlign: "center",
                    writingDirection: "rtl",
                    // The label sits in a fixed bar: keep the line to the
                    // glyphs' measured height, not more.
                    lineHeight: 17,
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

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // A short horizontal shift between tabs. The navigator order is the
        // mirrored (RTL) order, so screens slide in from the side their tab is on.
        animation: "shift",
      }}
    >
      {/* Declared in mirrored order so خانه renders on the right. */}
      {[...tabs].reverse().map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
