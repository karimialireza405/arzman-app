import { formatNumber } from "@arzman/shared";
import { useApp } from "../store";

/** Formats Toman values using the user's unit + digit preferences. */
export function usePrice() {
  const { user } = useApp();
  return (value: number | null | undefined, digits = 2) =>
    value == null
      ? "—"
      : formatNumber(
          value * (user.settings.unit === "IRR" ? 10 : 1),
          user.settings.persian,
          digits,
        );
}
