/**
 * Floating Liquid Glass tab bar.
 *
 * Apple HIG · Tab bars:
 *  - "Use a tab bar to support navigation, not to provide actions."
 *  - "Prefer filled symbols or icons for consistency with the platform."
 *  - "Include tab labels to help with navigation."
 *
 * Liquid Glass specifics (HIG · Materials + iOS 26 tab bar behavior):
 *  - the bar floats above the content with the regular material, separated from
 *    the home indicator by a fixed gap;
 *  - the selected tab gets a *quiet* tinted capsule behind the symbol — no glow;
 *  - tabs are mirrored for the Persian RTL reading order (خانه on the right).
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppIcon,
  Glass,
  TAB_BAR,
  curve,
  persianText,
  spacing,
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

export default function TabLayout() {
  const t = useTheme();
  const feedback = useFeedback();
  const insets = useSafeAreaInsets();

  // The bar floats a fixed gap above the home indicator (or a 16pt floor).
  const bottomOffset = Math.max(insets.bottom, TAB_BAR.sideInset) + TAB_BAR.bottomGap;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        // A short horizontal shift between tabs. The navigator order is the
        // mirrored (RTL) order, so screens slide in from the side their tab is on.
        animation: "shift",
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textTertiary,
        tabBarStyle: {
          position: "absolute",
          bottom: bottomOffset,
          left: TAB_BAR.sideInset,
          right: TAB_BAR.sideInset,
          height: TAB_BAR.height,
          paddingTop: spacing.xxs - 2,
          paddingBottom: spacing.xxs - 2,
          paddingHorizontal: spacing.xxs,
          borderTopWidth: 0,
          borderRadius: TAB_BAR.height / 2,
          backgroundColor: "transparent",
          elevation: 0,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: t.dark ? 0.5 : 0.14,
          shadowRadius: 16,
        },
        tabBarBackground: () => (
          <Glass
            glassEffectStyle="regular"
            interactive
            radius={TAB_BAR.height / 2}
            specular
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      {[...tabs].reverse().map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  width: 46,
                  height: 30,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 15,
                  borderCurve: curve.continuous,
                  backgroundColor: focused ? t.accentFill : "transparent",
                }}
              >
                <AppIcon
                  name={focused ? tab.activeIcon : tab.inactiveIcon}
                  size={23}
                  color={color}
                  weight={focused ? "semibold" : "regular"}
                />
              </View>
            ),
            tabBarLabel: ({ focused, color, children }) => (
              <Text
                allowFontScaling={false}
                style={persianText(
                  {
                    color,
                    fontSize: 10,
                    fontWeight: focused ? "700" : "500",
                    textAlign: "center",
                    writingDirection: "rtl",
                  },
                  children,
                )}
              >
                {children}
              </Text>
            ),
          }}
          listeners={{
            tabPress: () => {
              feedback.tap();
            },
          }}
        />
      ))}
    </Tabs>
  );
}
