/**
 * In-app banner for a fired price alert. Works on every platform (unlike
 * `Alert.alert`, which does nothing on the web) and dismisses itself.
 */
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../store";
import { radii, spacing } from "../design-system";
import { AppIcon, Label } from "./primitives";
import { useTheme } from "./theme";

const VISIBLE_MS = 9000;

export function AlertBanner() {
  const { notice, dismissNotice } = useApp();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismissNotice, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + spacing.xxs,
        start: spacing.sm,
        end: spacing.sm,
        zIndex: 1000,
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={dismissNotice}
        accessibilityRole="alert"
        accessibilityLabel={`${notice.title}. ${notice.lines.join(". ")}`}
        accessibilityHint="برای بستن لمس کنید"
        style={{
          width: "100%",
          maxWidth: 520,
          flexDirection: "row-reverse",
          alignItems: "flex-start",
          gap: spacing.xs,
          padding: spacing.sm,
          borderRadius: radii.card,
          backgroundColor: t.accentSolid,
        }}
      >
        <AppIcon name="notifications" size={20} color="#FFFFFF" style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Label size={14} weight="700" style={{ color: "#FFFFFF" }}>
            {notice.title}
          </Label>
          {notice.lines.map((line) => (
            <Label key={line} size={13} style={{ color: "#FFFFFF" }}>
              {line}
            </Label>
          ))}
        </View>
      </Pressable>
    </View>
  );
}
