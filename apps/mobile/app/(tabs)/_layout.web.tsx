/**
 * Tab bar for the web build (Safari "Add to Home Screen" on iPhone).
 *
 * Native tabs render as a strip at the top of the page on the web, over the
 * ArzMan wordmark. iPhone users expect tabs at the bottom, so the web uses the
 * navigator's JS bar there, frosted like the iOS bar. The navigator adds the
 * home-indicator inset below the items, which on the web comes from
 * env(safe-area-inset-bottom) via viewport-fit=cover in public/index.html.
 *
 * Tabs are declared in mirrored order so خانه sits on the right for Persian.
 */
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, appFont, fontFamilies, useTheme } from "../../src/ui";

export const unstable_settings = { initialRouteName: "index" };

const tabs = [
  { name: "more", title: "بیشتر", icon: "ellipsis-horizontal-circle-outline", activeIcon: "more" },
  { name: "converter", title: "مبدل", icon: "swap-horizontal", activeIcon: "swap-horizontal" },
  { name: "market", title: "بازار", icon: "stats-chart-outline", activeIcon: "stats-chart" },
  { name: "index", title: "خانه", icon: "home-outline", activeIcon: "home" },
];

export default function TabLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textSecondary,
        // Persian needs ≥1.5625× line height or its dots and descenders clip.
        tabBarLabelStyle: { fontFamily: appFont(fontFamilies.medium), fontSize: 11, lineHeight: 18, flexShrink: 0 },
        tabBarItemStyle: { paddingTop: 4 },
        tabBarStyle: {
          // Taller than the navigator's default 49pt so the icon and an unclipped 18pt label fit;
          // the home-indicator inset sits below the items.
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: t.dark ? "rgba(18, 19, 28, 0.82)" : "rgba(250, 250, 253, 0.82)",
          borderTopColor: t.separator,
          // Frosted like the iOS bar. React Native's types don't know this CSS
          // property, but react-native-web passes it through.
          ...({ backdropFilter: "blur(20px) saturate(180%)" } as object),
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
              <AppIcon name={focused ? tab.activeIcon : tab.icon} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
