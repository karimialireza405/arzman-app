/**
 * Tab bar — the system's native one (UITabBarController on iOS).
 *
 * The owner asked for the iOS 26/27 behaviour: press the bar, drag a Liquid
 * Glass lens across the tabs, see it swell and refract under the finger. That
 * lens is drawn by UIKit itself; a React Native imitation cannot refract what
 * is behind it. Native tabs give the real thing, plus the system's scroll-edge
 * effect and automatic content insets, and they are included in Expo Go.
 *
 * Earlier versions drew a custom JS bar; see git history for why the
 * navigator's default JS bar broke on iPhone.
 *
 * Tabs are declared in mirrored order so خانه sits on the right for Persian.
 * The app launches at "/", which resolves to Home regardless of order.
 */
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { appFont, fontFamilies, useTheme } from "../../src/ui";

export const unstable_settings = { initialRouteName: "index" };

export default function TabLayout() {
  const t = useTheme();
  return (
    <NativeTabs
      tintColor={t.accent}
      labelStyle={{ fontFamily: appFont(fontFamilies.medium), fontSize: 11 }}
    >
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Icon
          sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }}
          md="more_horiz"
        />
        <NativeTabs.Trigger.Label>بیشتر</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="converter">
        <NativeTabs.Trigger.Icon sf="arrow.left.arrow.right" md="swap_horiz" />
        <NativeTabs.Trigger.Label>مبدل</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="market">
        <NativeTabs.Trigger.Icon
          sf={{ default: "chart.xyaxis.line", selected: "chart.line.uptrend.xyaxis" }}
          md="show_chart"
        />
        <NativeTabs.Trigger.Label>بازار</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>خانه</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
