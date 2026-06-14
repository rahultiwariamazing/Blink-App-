// ============================================================================
// FILE: src/components/common/CommonText.ts
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This file defines a reusable set of **typography tokens** used throughout
// the application.
//
// Instead of every screen writing inline font sizes, all screens can import:
//
//     import { txt } from "../common/CommonText";
//
// This ensures a **consistent design system**, avoids duplication, and acts
// similar to a MAUI ResourceDictionary that hosts text styles.
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UI FOUNDATION LAYER (Design System)
//    - Pure style declarations, no React components
//    - Shared everywhere in UI
//    - Provides a predictable typography scale
//
// THEME SYSTEM NOTE
// ----------------------------------------------------------------------------
// • These styles pull colors directly from theme/colors.ts (static palette)
// • This is allowed because typography tokens are stable & foundational
// • If dynamic theme-based typography is needed later, this file can be
//   migrated to use ThemeContext + useMemo.
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// In .NET MAUI, this resembles:
//
//   <ResourceDictionary>
//       <Style x:Key="H1" TargetType="Label">
//           <Setter Property="FontSize" Value="22" />
//           <Setter Property="TextColor" Value="{StaticResource TextColor}" />
//       </Style>
//
//       <Style x:Key="MutedText" TargetType="Label">
//           <Setter Property="FontSize" Value="12" />
//           <Setter Property="TextColor" Value="{StaticResource MutedColor}" />
//       </Style>
//   </ResourceDictionary>
//
// LOGGING STRATEGY
// ----------------------------------------------------------------------------
// Tag: [CommonText]
// • Logs once when the module is loaded (development-only diagnostic)
// • No per-render logs, since this file exports static styles only
//
// ============================================================================

import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

// Module-load diagnostic log (runs once)
console.log("[CommonText] typography styles initialized");

export const txt = StyleSheet.create({
  h1: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 14,
    color: colors.text,
  },
  muted: {
    fontSize: 12,
    color: colors.muted,
  },
  p: {
    fontSize: 14,
    color: colors.text,
  },
});
