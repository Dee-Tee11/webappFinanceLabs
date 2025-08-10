const colors = {
  // Básicos
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  text: "#111827",
  background: "#F9FAFB",
  
  // Cinzas (backgrounds, texto, bordas)
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray500: "#6B7280",
  gray700: "#374151",
  gray800: "#1F2937",
  
  // Primário / Secundário (branding)
  primary: "#667eea",
  secondary: "#764ba2",
  primaryGradient: ["#667eea", "#764ba2"],
  
  // Verdes (sucesso, info útil)
  green50: "#DCFCE7",
  green600: "#16A34A",
  green700: "#059669",
  
  // Vermelhos (erro, alerta)
  red50: "#FEF2F2",
  red600: "#DC2626",
  
  // Extras e overlays
  whiteOpacity85: "rgba(255, 255, 255, 0.85)",
  whiteSoft: "rgba(255, 255, 255, 0.2)",
  whiteStrong: "rgba(255, 255, 255, 0.85)",
  blueLight: "rgba(102, 126, 234, 0.1)",
  blackOverlay: "rgba(0, 0, 0, 0.6)",
  blackStrong: "rgba(0, 0, 0, 0.9)",
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

const radius = {
  sm: 6,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

const fontSizes = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 24,
  "4xl": 28,
  title: 22,
  display: 24,
  hero: 28,
  mega: 32,
};

const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semiBold: "600" as const,
  bold: "700" as const,
  extraBold: "800" as const,
};

export const theme = {
  colors,
  spacing,
  radius,
  fontSizes,
  fontWeight,
};