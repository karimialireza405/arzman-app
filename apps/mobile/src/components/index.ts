/**
 * ArzMan UI kit barrel.
 *
 * Screens import from `src/ui` (or `src/components`) and never reach into the
 * individual modules, so the design system can evolve in one place.
 */
export * from "./theme";
export * from "./primitives";
export * from "./surfaces";
export * from "./controls";
export * from "./market";
export * from "./quote-hero";
export * from "./sparkline";
export * from "./skeleton";
export * from "./screen";

export {
  ArzManDesignSystem,
  colors as systemColors,
  concentricRadius,
  curve,
  appFont,
  fontFamilies,
  fontFamilyFor,
  persianText,
  PERSIAN_LINE_HEIGHT,
  iconSizes,
  materials,
  motion,
  radii,
  semanticSpacing,
  spacing,
  springs,
  typography,
} from "../design-system";
export type { TextStyleName } from "../design-system";
export {
  CurrencyBadge,
  CurrencyIcon,
  badgeSizes,
  currencyGlyphs,
  currencyTint,
} from "../design-system/currency-icons";

import { radii as r, semanticSpacing as s } from "../design-system";

export const tokens = { space: s, radius: r };
