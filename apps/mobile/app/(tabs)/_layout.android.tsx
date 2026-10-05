/**
 * Tab bar on Android (and the web): ArzMan's floating glass bar.
 *
 * Material's native bottom navigation follows the device theme, not ArzMan's
 * appearance setting, so in light mode it stayed black, and it is flat and
 * edge to edge. See src/components/tab-bar.tsx.
 *
 * Tabs are declared in mirrored order so خانه sits on the right for Persian.
 */
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FloatingTabBar,
  TabBarClearanceContext,
  tabBarClearance,
  useTheme,
  type TabSpec,
} from "../../src/ui";

export const unstable_settings = { initialRouteName: "index" };

const tabs: TabSpec[] = [
  { name: "more", title: "بیشتر", icon: "ellipsis-horizontal-circle-outline", activeIcon: "more" },
  { name: "converter", title: "مبدل", icon: "swap-horizontal", activeIcon: "swap-horizontal" },
  { name: "market", title: "بازار", icon: "stats-chart-outline", activeIcon: "stats-chart" },
  { name: "index", title: "خانه", icon: "home-outline", activeIcon: "home" },
];

export default function TabLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <TabBarClearanceContext.Provider value={tabBarClearance(insets.bottom)}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} tabs={tabs} />}
        screenOptions={{
          headerShown: false,
          // Screens extend under the floating bar; their background must be
          // the theme's, or the navigator's white shows in dark mode.
          sceneStyle: { backgroundColor: t.background },
          animation: "fade",
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
        ))}
      </Tabs>
    </TabBarClearanceContext.Provider>
  );
}
