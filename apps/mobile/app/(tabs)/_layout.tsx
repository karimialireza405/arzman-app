import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass, useTheme, AppIcon, radii } from "../../src/ui";
import { useApp } from "../../src/store";

interface TabConfig {
  name: string;
  title: string;
  activeIcon: string;
  inactiveIcon: string;
}

const tabs: TabConfig[] = [
  {
    name: "index",
    title: "خانه",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  {
    name: "market",
    title: "بازار",
    activeIcon: "stats-chart",
    inactiveIcon: "stats-chart-outline",
  },
  {
    name: "converter",
    title: "مبدل",
    activeIcon: "swap-horizontal",
    inactiveIcon: "swap-horizontal",
  },
  {
    name: "portfolio",
    title: "دارایی من",
    activeIcon: "wallet",
    inactiveIcon: "wallet-outline",
  },
  {
    name: "more",
    title: "بیشتر",
    activeIcon: "more",
    inactiveIcon: "ellipsis-horizontal-circle-outline",
  },
];

export default function TabLayout() {
  const t = useTheme();
  const { haptic } = useApp();
  const insets = useSafeAreaInsets();

  const bottomOffset = Math.max(insets.bottom + 4, 16);
  const barHeight = 64;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textTertiary,
        tabBarStyle: {
          position: "absolute",
          bottom: bottomOffset,
          left: 16,
          right: 16,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 8,
          borderTopWidth: 0,
          borderRadius: radii.pill,
          backgroundColor: "transparent",
          elevation: 0,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: t.dark ? 0.45 : 0.12,
          shadowRadius: 16,
        },
        tabBarBackground: () => (
          <Glass
            glassEffectStyle="regular"
            interactive
            radius={radii.pill}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: t.dark
                  ? "rgba(22, 25, 33, 0.78)"
                  : "rgba(255, 255, 255, 0.85)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.glassRim,
              },
            ]}
          >
            {/* Specular edge sheen for iOS 27 Liquid Glass aesthetic */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 20,
                right: 20,
                height: StyleSheet.hairlineWidth,
                backgroundColor: t.glassSpecular,
              }}
            />
          </Glass>
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  width: 32,
                  height: 28,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: focused
                    ? t.dark
                      ? "rgba(10, 132, 255, 0.16)"
                      : "rgba(0, 122, 255, 0.12)"
                    : "transparent",
                }}
              >
                <AppIcon
                  name={focused ? tab.activeIcon : tab.inactiveIcon}
                  size={21}
                  color={color}
                />
              </View>
            ),
          }}
          listeners={{
            tabPress: () => {
              haptic();
            },
          }}
        />
      ))}
    </Tabs>
  );
}
