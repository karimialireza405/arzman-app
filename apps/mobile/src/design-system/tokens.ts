/**
 * ArzManDesignSystem — Apple iOS 27 Liquid Glass Tokens
 *
 * Designed specifically for Persian-first Iranian currency market iPhone application.
 * Follows Apple Human Interface Guidelines and Liquid Glass principles:
 * - Clear two-layer separation: Chrome/Controls (Liquid Glass) vs Content (Opaque/Readable)
 * - OLED True Black background in dark mode, crisp system grouped background in light mode
 * - Concentric geometry (outer curvature determines inner curvature)
 * - Restrained, meaningful use of materials and color
 */

export const typography = {
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
  displayHero: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 44,
};

export const radii = {
  sheet: 32,
  card: 24,
  cardNested: 16,
  control: 14,
  controlSmall: 10,
  pill: 9999,
  circle: 9999,
};

/** Concentric curvature helper: preserves visually identical center curvature */
export function concentricRadius(outerRadius: number, padding: number, min = 6): number {
  return Math.max(min, outerRadius - padding);
}

export const colors = {
  dark: {
    background: "#000000",          // Pure OLED black
    backgroundSecondary: "#0C0D10", // Sub-surface
    backgroundTertiary: "#14161C",  // Deep wells
    surface: "#12141A",             // Card surface (opaque, crisp)
    surfaceElevated: "#181A22",     // Elevated content card
    surfaceHover: "#20232E",        // Touched surface

    // Liquid Glass materials
    glassRegular: "rgba(30, 34, 44, 0.72)",
    glassClear: "rgba(18, 20, 26, 0.46)",
    glassProminent: "rgba(42, 48, 62, 0.85)",
    glassInteractive: "rgba(50, 56, 72, 0.90)",
    glassRim: "rgba(255, 255, 255, 0.12)",
    glassSpecular: "rgba(255, 255, 255, 0.18)",

    line: "rgba(255, 255, 255, 0.08)",
    lineSubtle: "rgba(255, 255, 255, 0.05)",
    lineOpaque: "#21242E",

    text: "#FFFFFF",
    textSecondary: "#A0A7B5",
    textTertiary: "#697080",
    textQuaternary: "#424754",
    muted: "#8E95A5",

    accent: "#0A84FF",              // iOS System Blue
    accentGlass: "rgba(10, 132, 255, 0.20)",
    accentText: "#60A5FA",

    green: "#30D158",               // iOS System Green
    greenGlass: "rgba(48, 209, 88, 0.18)",
    greenText: "#4ADE80",

    red: "#FF453A",                 // iOS System Red
    redGlass: "rgba(255, 69, 58, 0.18)",
    redText: "#F87171",

    amber: "#FFD60A",               // iOS System Yellow
    amberGlass: "rgba(255, 214, 10, 0.18)",
    amberText: "#FBBF24",

    raised: "#1B1E26",
  },
  light: {
    background: "#F2F2F7",          // Apple system grouped background
    backgroundSecondary: "#E5E5EA",
    backgroundTertiary: "#D1D1D6",
    surface: "#FFFFFF",             // Card surface
    surfaceElevated: "#FFFFFF",
    surfaceHover: "#F6F6F9",

    // Liquid Glass materials
    glassRegular: "rgba(255, 255, 255, 0.82)",
    glassClear: "rgba(255, 255, 255, 0.58)",
    glassProminent: "rgba(242, 244, 248, 0.92)",
    glassInteractive: "rgba(230, 234, 242, 0.94)",
    glassRim: "rgba(255, 255, 255, 0.85)",
    glassSpecular: "rgba(0, 0, 0, 0.04)",

    line: "rgba(0, 0, 0, 0.07)",
    lineSubtle: "rgba(0, 0, 0, 0.04)",
    lineOpaque: "#E5E5EA",

    text: "#000000",
    textSecondary: "#636366",
    textTertiary: "#8E8E93",
    textQuaternary: "#C7C7CC",
    muted: "#6B7280",

    accent: "#007AFF",              // Apple System Blue
    accentGlass: "rgba(0, 122, 255, 0.12)",
    accentText: "#0055B3",

    green: "#248A3D",               // Apple System Green
    greenGlass: "rgba(52, 199, 89, 0.14)",
    greenText: "#15803D",

    red: "#D70015",                 // Apple System Red
    redGlass: "rgba(255, 59, 48, 0.12)",
    redText: "#B91C1C",

    amber: "#B25000",               // Apple System Orange
    amberGlass: "rgba(255, 149, 0, 0.14)",
    amberText: "#B45309",

    raised: "#E8EDF4",
  },
};

export const springs = {
  snappy: { damping: 18, mass: 0.9, stiffness: 220 },
  bouncy: { damping: 14, mass: 1.0, stiffness: 180 },
  gentle: { damping: 24, mass: 1.1, stiffness: 140 },
};

export const ArzManDesignSystem = {
  typography,
  spacing,
  radii,
  colors,
  springs,
  concentricRadius,
};
