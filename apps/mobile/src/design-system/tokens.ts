/**
 * ArzMan Design Tokens — Apple iOS 17/18 Compliant
 *
 * Grounded in official Apple Human Interface Guidelines:
 * - Materials (5-level hierarchy, Liquid Glass)
 * - Tab Bars (49pt, regularMaterial, continuous 26pt)
 * - Buttons (semantic styles: borderedProminent, bordered, plain, glass)
 * - Corner Radii (continuous curves mandatory)
 * - Typography (Dynamic Type scale, SF Pro / SF Rounded)
 * - Vibrancy (semantic label colors: primary, secondary, tertiary)
 * - Spacing (8pt base grid)
 * - Shadows (4 elevation levels)
 * - Motion (spring configs)
 *
 * Dark Mode: OLED true black (#000000), Apple system surfaces
 * Light Mode: Apple system grouped background (#F2F2F7)
 */

// ============================================================================
// COLOR SYSTEM — Apple System Colors
// ============================================================================

export const colors = {
  // --- Dark Mode (OLED True Black) ---
  dark: {
    // Base surfaces
    background: "#07080E",              // OLED true black
    backgroundSecondary: "#0B0D16",     // Subtle elevation
    surface: "#11131E",                 // Apple systemBackground (dark)
    surfaceElevated: "#171A28",         // Apple secondarySystemBackground
    surfaceOverlay: "#20243A",          // Apple tertiarySystemBackground

    // Semantic text (vibrancy-ready)
    text: "#F5F6FA",                    // .primary - vibrant on glass
    textSecondary: "rgba(235, 237, 250, 0.64)",         // .secondary - 60% opacity white
    textTertiary: "rgba(235, 237, 250, 0.46)",          // .tertiary - 40% opacity white
    textQuaternary: "rgba(235, 237, 250, 0.24)",        // .quaternary - 20% opacity white

    // System accent colors (exact iOS values)
    accent: "#A78BFA",                  // iOS Blue
    accentSolid: "#6D4AFF",             // brand fill behind white text (5.15:1)
    accentSecondary: "#7C5CFF",         // iOS Purple
    accentTertiary: "#F5B84B",          // iOS Orange

    // Directional (with vibrancy)
    green: "#30D158",                   // iOS Green
    greenBackground: "rgba(48, 209, 88, 0.15)",
    red: "#FF6B61",                     // iOS Red
    redBackground: "rgba(255, 69, 58, 0.15)",
    amber: "#F5B84B",                   // iOS Orange/Amber
    amberBackground: "rgba(245, 184, 75, 0.15)",

    // Glass Materials (matching iOS material recipes)
    glassRegular: "rgba(17, 19, 30, 0.72)",      // .regularMaterial
    glassThick: "rgba(17, 19, 30, 0.88)",        // .thickMaterial
    glassThin: "rgba(17, 19, 30, 0.52)",         // .thinMaterial
    glassUltraThin: "rgba(17, 19, 30, 0.32)",    // .ultraThinMaterial

    // Glass borders & highlights
    glassRim: "rgba(255, 255, 255, 0.10)",       // Inner stroke
    glassSpecular: "rgba(255, 255, 255, 0.25)",  // Top-edge highlight
    glassSeparator: "rgba(255, 255, 255, 0.1)",  // Hairline separator

    // Dividers
    separator: "rgba(255, 255, 255, 0.08)",
    separatorOpaque: "#1F2233",

    // Interactive states
    pressedOverlay: "rgba(255, 255, 255, 0.06)",
    selectedOverlay: "rgba(139, 92, 246, 0.18)",

    // Shadows (dark mode - more subtle)
    shadowLevel1: "rgba(0, 0, 0, 0.15)",
    shadowLevel2: "rgba(0, 0, 0, 0.20)",
    shadowLevel3: "rgba(0, 0, 0, 0.25)",
    shadowLevel4: "rgba(0, 0, 0, 0.30)",

    // Hairlines (never pure black/white — Apple uses translucent separators)
    lineSubtle: "rgba(255, 255, 255, 0.05)",

    // Control fills (Apple fill colors, dark)
    fillPrimary: "rgba(120, 122, 150, 0.30)",     // systemFill
    fillSecondary: "rgba(120, 122, 150, 0.24)",   // secondarySystemFill
    fillTertiary: "rgba(120, 122, 150, 0.18)",    // tertiarySystemFill
    fillQuaternary: "rgba(120, 122, 150, 0.12)",  // quaternarySystemFill

    // Legacy aliases (kept so partially migrated screens keep compiling)
    muted: "#8E8E93",
    line: "rgba(255, 255, 255, 0.08)",
    raised: "#171A28",
    surfaceHover: "#20243A",
    glassClear: "rgba(17, 19, 30, 0.45)",
    glassProminent: "rgba(23, 26, 40, 0.88)",
    accentGlass: "rgba(139, 92, 246, 0.20)",
    accentFill: "rgba(139, 92, 246, 0.18)",
    greenFill: "rgba(48, 209, 88, 0.15)",
    greenGlass: "rgba(48, 209, 88, 0.15)",
    redFill: "rgba(255, 107, 97, 0.15)",
    redGlass: "rgba(255, 107, 97, 0.15)",
    amberFill: "rgba(245, 184, 75, 0.15)",
    amberGlass: "rgba(245, 184, 75, 0.15)",
    greenText: "#30D158",
    redText: "#FF453A",
    amberText: "#FF9F0A",
  },

  // --- Light Mode (Apple System Grouped) ---
  light: {
    // Base surfaces
    background: "#F4F5FA",              // Apple systemGroupedBackground
    backgroundSecondary: "#FFFFFF",     // White
    surface: "#FFFFFF",                 // Apple systemBackground
    surfaceElevated: "#F4F5FA",         // Apple secondarySystemBackground
    surfaceOverlay: "#EBEDF5",          // Apple tertiarySystemBackground

    // Semantic text
    text: "#0B0D17",                    // .primary
    textSecondary: "rgba(11, 13, 23, 0.62)",         // .secondary - 60% opacity black
    textTertiary: "rgba(11, 13, 23, 0.48)",          // .tertiary - 40% opacity black
    textQuaternary: "rgba(11, 13, 23, 0.24)",        // .quaternary - 20% opacity black

    // System accent colors
    accent: "#6D28D9",                  // iOS Blue
    accentSolid: "#6D28D9",             // brand fill behind white text (7.10:1)
    accentSecondary: "#7C3AED",         // iOS Purple
    accentTertiary: "#B7791F",          // iOS Orange

    // Directional
    green: "#177A34",                   // iOS Green
    greenBackground: "rgba(52, 199, 89, 0.12)",
    red: "#D92D20",                     // iOS Red
    redBackground: "rgba(255, 59, 48, 0.12)",
    amber: "#B7791F",                   // iOS Orange
    amberBackground: "rgba(255, 149, 0, 0.12)",

    // Glass Materials
    glassRegular: "rgba(255, 255, 255, 0.80)",
    glassThick: "rgba(255, 255, 255, 0.92)",
    glassThin: "rgba(255, 255, 255, 0.60)",
    glassUltraThin: "rgba(255, 255, 255, 0.40)",

    // Glass borders & highlights
    glassRim: "rgba(0, 0, 0, 0.08)",
    glassSpecular: "rgba(255, 255, 255, 0.6)",
    glassSeparator: "rgba(0, 0, 0, 0.06)",

    // Dividers
    separator: "rgba(11, 13, 23, 0.08)",
    separatorOpaque: "#C6C6C8",

    // Interactive states
    pressedOverlay: "rgba(11, 13, 23, 0.05)",
    selectedOverlay: "rgba(109, 40, 217, 0.10)",

    // Shadows (light mode)
    shadowLevel1: "rgba(0, 0, 0, 0.05)",
    shadowLevel2: "rgba(0, 0, 0, 0.08)",
    shadowLevel3: "rgba(0, 0, 0, 0.12)",
    shadowLevel4: "rgba(0, 0, 0, 0.16)",

    // Hairlines
    lineSubtle: "rgba(11, 13, 23, 0.05)",

    // Control fills (Apple fill colors, light)
    fillPrimary: "rgba(120, 120, 128, 0.20)",
    fillSecondary: "rgba(120, 120, 128, 0.16)",
    fillTertiary: "rgba(118, 118, 128, 0.12)",
    fillQuaternary: "rgba(116, 118, 128, 0.08)",

    // Legacy aliases (kept so partially migrated screens keep compiling)
    muted: "#8E8E93",
    line: "rgba(11, 13, 23, 0.08)",
    raised: "#FFFFFF",
    surfaceHover: "#E5E5EA",
    glassClear: "rgba(255, 255, 255, 0.55)",
    glassProminent: "rgba(255, 255, 255, 0.95)",
    accentGlass: "rgba(109, 40, 217, 0.12)",
    accentFill: "rgba(109, 40, 217, 0.10)",
    greenFill: "rgba(52, 199, 89, 0.12)",
    greenGlass: "rgba(52, 199, 89, 0.12)",
    redFill: "rgba(255, 59, 48, 0.12)",
    redGlass: "rgba(255, 59, 48, 0.12)",
    amberFill: "rgba(255, 149, 0, 0.12)",
    amberGlass: "rgba(255, 149, 0, 0.12)",
    greenText: "#248A3D",
    redText: "#D70015",
    amberText: "#C93400",
  },
};

// ============================================================================
// SPACING — 8pt Base Grid (Apple Design Resources)
// ============================================================================

export const spacing = {
  // Base unit = 4pt, but all layout uses 8pt multiples
  none: 0,
  xxxs: 4,   // 0.5x - micro adjustments
  xxs: 8,    // 1x - base unit
  xs: 12,    // 1.5x
  sm: 16,    // 2x - standard padding
  md: 20,    // 2.5x
  lg: 24,    // 3x
  xl: 28,    // 3.5x
  xxl: 32,   // 4x
  xxxl: 40,  // 5x
  huge: 48,  // 6x
  massive: 56, // 7x
} as const;

// Semantic spacing aliases
export const semanticSpacing = {
  screenPadding: spacing.sm,           // 16
  screenPaddingLarge: spacing.md,      // 20
  sectionGap: spacing.lg,              // 24
  cardPadding: spacing.sm,             // 16
  cardPaddingLarge: spacing.md,        // 20
  itemGap: spacing.xs,                 // 12
  itemGapSmall: spacing.xxs,           // 8
  controlPadding: spacing.xs,          // 12
  controlPaddingLarge: spacing.sm,     // 16
  inlineGap: spacing.xxs,              // 8
  groupGap: spacing.md,                // 20
} as const;

// ============================================================================
// CORNER RADII — Continuous Curves (Simulated)
// ============================================================================

// Note: React Native doesn't support native continuous corners.
// We simulate by using slightly larger radius + consistent inner/outer ratio.
// Apple continuous radius ≈ radius * 1.15 for visual equivalence.

export const radii = {
  // Content cards (16-20pt continuous → ~18-23pt RN)
  card: 18,
  cardLarge: 22,
  cardSmall: 14,

  // Controls (14-16pt continuous → ~16-18pt RN)
  control: 16,
  controlLarge: 18,
  controlSmall: 12,

  // Buttons (large = 14-16pt continuous → ~16-18pt RN)
  button: 16,
  buttonLarge: 18,
  buttonSmall: 12,

  // Sheets/Modals (16-20pt continuous → ~18-23pt RN)
  sheet: 22,
  sheetLarge: 26,

  // Tab bar (26pt continuous → ~30pt RN)
  tabBar: 30,

  // Pills/badges (fully rounded)
  pill: 9999,
  badge: 9999,

  // Currency badges (12-14pt continuous → ~14-16pt RN)
  currencyBadge: 14,
  currencyBadgeLarge: 16,

  // Concentric radius helper
  // inner = outer - padding (clamped to minimum 6)
  concentric: (outer: number, padding: number, min = 6): number => Math.max(min, outer - padding),
} as const;

// ============================================================================
// TYPOGRAPHY — Apple Dynamic Type Scale (SF Pro / SF Rounded)
// ============================================================================

export const typography = {
  // Display styles (for hero prices, large titles)
  displayLarge: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    fontFamily: "System", // SF Pro Rounded preferred
  },
  displayMedium: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700" as const,
    letterSpacing: -0.4,
    fontFamily: "System",
  },
  displaySmall: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    fontFamily: "System",
  },

  // Navigation / Screen titles
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700" as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600" as const,
    letterSpacing: 0.38,
  },

  // Content hierarchy
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400" as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "400" as const,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400" as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "400" as const,
    letterSpacing: 0.07,
  },

  // Financial numbers (tabular figures)
  priceHero: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    fontFamily: "System",
    fontVariant: ["tabular-nums"] as const,
  },
  priceLarge: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    fontFamily: "System",
    fontVariant: ["tabular-nums"] as const,
  },
  priceMedium: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    fontFamily: "System",
    fontVariant: ["tabular-nums"] as const,
  },
  priceSmall: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.1,
    fontFamily: "System",
    fontVariant: ["tabular-nums"] as const,
  },

  // Currency badges (SF Rounded)
  badgeLarge: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.1,
    fontFamily: "System",
  },
  badgeMedium: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700" as const,
    letterSpacing: 0,
    fontFamily: "System",
  },
  badgeSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600" as const,
    letterSpacing: 0,
    fontFamily: "System",
  },
} as const;

// ============================================================================
// SHADOWS — 4 Elevation Levels (Apple Depth)
// ============================================================================

export const shadows = {
  // Level 0: Flat (content cards on background)
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Level 1: Raised (hovered cards, selected segments)
  level1: {
    dark: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 1,
    },
    light: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  },

  // Level 2: Floating (tab bar, sheets, popovers)
  level2: {
    dark: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.20,
      shadowRadius: 8,
      elevation: 4,
    },
    light: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  // Level 3: Modal (sheets, alerts)
  level3: {
    dark: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    light: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // Level 4: FAB/Overlay (floating action buttons)
  level4: {
    dark: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.30,
      shadowRadius: 24,
      elevation: 12,
    },
    light: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 12,
    },
  },
} as const;

// ============================================================================
// MOTION — Spring Configurations (Apple Native Feel)
// ============================================================================

export const springs = {
  // Press feedback (~100ms)
  press: {
    damping: 18,
    stiffness: 180,
    mass: 1.0,
  },

  // Tab transitions (~200ms)
  tab: {
    damping: 22,
    stiffness: 170,
    mass: 1.0,
  },

  // Sheet present/dismiss (~300ms)
  modal: {
    damping: 28,
    stiffness: 190,
    mass: 1.2,
  },

  // General UI (snappy)
  snappy: {
    damping: 15,
    stiffness: 200,
    mass: 0.9,
  },

  // Gentle (for content)
  gentle: {
    damping: 25,
    stiffness: 150,
    mass: 1.1,
  },
} as const;

// ============================================================================
// ICON SIZES — Apple System
// ============================================================================

export const iconSizes = {
  // Tab bar icons
  tabBar: 25,

  // Navigation bar / toolbar
  navigation: 22,

  // Toolbar / action buttons
  toolbar: 20,

  // Currency badges
  currencyBadge: 18,
  currencyBadgeLarge: 22,

  // List/item icons
  list: 22,
  listSmall: 18,

  // Inline with text
  inline: 16,
  inlineSmall: 14,

  // FAB
  fab: 24,
} as const;

// ============================================================================
// BORDER WIDTHS
// ============================================================================

export const borders = {
  hairline: 0.5,        // StyleSheet.hairlineWidth
  thin: 1,              // Standard border
  medium: 1.5,          // Emphasized
  focus: 2,             // Focus ring
} as const;

// ============================================================================
// OPACITY VALUES
// ============================================================================

export const opacity = {
  disabled: 0.38,
  pressed: 0.08,        // Overlay on press
  hover: 0.04,          // Overlay on hover (web)
  selected: 0.12,       // Selected overlay
  glassOverlay: 0.08,   // Glass press overlay
  backdrop: 0.4,        // Modal backdrop
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
  loading: 1000,
} as const;

// ============================================================================
// BREAKPOINTS (for responsive layout if needed)
// ============================================================================

export const breakpoints = {
  compact: 375,    // iPhone SE / mini
  regular: 390,    // iPhone 14/15/16 Pro
  large: 428,      // iPhone 14/15/16 Pro Max
  ipad: 768,       // iPad
} as const;

// ============================================================================
// CONTINUOUS CURVES — Apple squircle geometry
// ============================================================================
//
// React Native exposes the native iOS squircle through `borderCurve`.
// Apple requires continuous curvature for system-aligned containers,
// because a standard circular corner looks "legacy" on modern devices.

export const curve = {
  /** Continuous (squircle) corner — the Apple default on iOS. */
  continuous: "continuous" as const,
  /** Circular corner — only for non-container ornaments. */
  circular: "circular" as const,
};

/**
 * Concentric curvature helper.
 *
 * Apple's concentricity rule: the inner radius of a nested container should
 * equal `outerRadius - padding` so both curves share the same center point.
 * When a very large padding would collapse the inner radius, we clamp it to
 * `min` (Apple clamps to a small radius rather than producing a 0pt corner).
 *
 * @param outerRadius radius of the enclosing container
 * @param padding distance between the outer edge and the inner element
 * @param min smallest acceptable inner radius (default 6)
 */
export function concentricRadius(
  outerRadius: number,
  padding: number,
  min = 6,
): number {
  return Math.max(min, outerRadius - padding);
}

/** Ready-made concentric pairs used across ArzMan (kept explicit, not magic). */
export const concentricPairs = {
  /** Screen-level card (18pt) holding an inset control with 12pt padding. */
  cardControl: concentricRadius(18, 12),
  /** Large hero card (22pt) holding an inset control with 16pt padding. */
  heroControl: concentricRadius(22, 16),
  /** Sheet (26pt) holding grouped rows with 20pt padding. */
  sheetRow: concentricRadius(26, 20),
} as const;

// ============================================================================
// MATERIALS — where Liquid Glass is allowed (chrome) vs opaque (content)
// ============================================================================
//
// Apple: "Liquid Glass forms a distinct functional layer for controls and
// navigation elements" and "standard materials help with visual
// differentiation within the content layer". Glass on content hurts legibility,
// so ArzMan keeps market content opaque and spends glass only on chrome.

export const materials = {
  /** Floating navigation chrome: tab bar, toolbars. */
  chrome: { blurIntensityDark: 45, blurIntensityLight: 70 },
  /** Sheets and modals — heavier, focused. */
  sheet: { blurIntensityDark: 60, blurIntensityLight: 85 },
  /** Interactive controls (buttons) sitting on top of content. */
  control: { blurIntensityDark: 35, blurIntensityLight: 60 },
  /** Hairline rim used to catch light at the top edge of a glass surface. */
  specularHeight: 0.5,
} as const;

// ============================================================================
// MOTION — durations that pair with the spring presets above
// ============================================================================

export const motion = {
  /** Hover-like overlays and color transitions. */
  instant: 100,
  /** Press in / press out. */
  press: 120,
  /** Tab selection and segmented indicator travel. */
  selection: 200,
  /** Screen-level transitions. */
  screen: 300,
  /** Long dismissals. */
  dismiss: 350,
} as const;

// ============================================================================
// TEXT STYLE NAMES — Apple Dynamic Type names used by the `Label` component
// ============================================================================

export const textStyleNames = [
  "displayLarge",
  "displayMedium",
  "displaySmall",
  "largeTitle",
  "title1",
  "title2",
  "title3",
  "headline",
  "body",
  "callout",
  "subheadline",
  "footnote",
  "caption1",
  "caption2",
  "priceHero",
  "priceLarge",
  "priceMedium",
  "priceSmall",
  "badgeLarge",
  "badgeMedium",
  "badgeSmall",
] as const;

export type TextStyleName = (typeof textStyleNames)[number];

// ============================================================================
// EXPORTS
// ============================================================================

export const ArzManDesignSystem = {
  colors,
  spacing,
  semanticSpacing,
  radii,
  typography,
  shadows,
  springs,
  motion,
  iconSizes,
  borders,
  opacity,
  zIndex,
  breakpoints,
  curve,
  materials,
  concentricPairs,
} as const;

// Type exports for consumers
export type Colors = typeof colors.dark;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
export type Springs = typeof springs;
export type IconSizes = typeof iconSizes;