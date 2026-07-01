// src/theme/colors.ts

export type AppColors = {
  // existing (keep)
  primary: string;
  secondary: string;
  text: string;
  muted: string;
  bg: string;
  card: string;
  border: string;

  // added (safe additions)
  inputBg: string;
  danger: string;
  link: string;
  textOnPrimary: string;
  textOnSecondary: string;
};

// ✅ Light theme (matches your current palette)
export const lightColors: AppColors = {
  // existing (keep)
  primary: "#16a34a",
  secondary: "#16a34a",
  text: "#111",
  muted: "#777",
  bg: "#fff",
  card: "#f9f9f9",
  border: "#ddd",

  // added (safe additions)
  inputBg: "#fff",
  danger: "#d32f2f",
  link: "#2563eb",
  textOnPrimary: "#fff",
  textOnSecondary: "#fff",
};

// ✅ Dark theme (new)
export const darkColors: AppColors = {
  // existing (keep)
  primary: "#22c55e",
  secondary: "#22c55e",
  text: "#e5e7eb",
  muted: "#9ca3af",
  bg: "#0b0f14",
  card: "#121826",
  border: "#263041",

  // added (safe additions)
  inputBg: "#0f1624",
  danger: "#f87171",
  link: "#60a5fa",
  textOnPrimary: "#07130a",
  textOnSecondary: "#07130a",
};

// ✅ Backward compatible export (existing imports still work)
export const colors = lightColors;
export default colors;
``