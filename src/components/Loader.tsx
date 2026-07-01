// ============================================================================
// FILE: src/components/Loader.tsx
//
// PURPOSE OF THIS COMPONENT
// ----------------------------------------------------------------------------
// This is a lightweight **full‑screen loading overlay** used across the app
// during long-running operations, such as:
//
//   • Order placement
//   • Authentication (Login / Signup)
//   • Address save/upsert
//   • Fetching product catalog
//
// FEATURES
// ----------------------------------------------------------------------------
// ✔ Blocks UI interaction while visible
// ✔ Displays ActivityIndicator centered
// ✔ Optional message ("Please wait...")
// ✔ Can be toggled with the `visible` prop
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UI FOUNDATION LAYER
//    - Purely a presentational component
//    - No business logic
//    - Parent ViewModel/screen decides when to show/hide
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// <Grid>
//     <ActivityIndicator IsRunning="{Binding IsBusy}" />
//     <BusyIndicator IsVisible="{Binding IsBusy}" />
// </Grid>
//
// - visible === IsBusy
// - The semi-transparent overlay dims background content
//
// THEME SYSTEM
// ----------------------------------------------------------------------------
// Colors come from theme palette (colors.primary).
// Overlay tint works well for both light/dark themes.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [Loader]
// - Logs when loader becomes visible/invisible
// - Logs provided text message
//
// ============================================================================

import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

export const Loader = ({
  visible = true,
  text = "Please wait...",
}: {
  visible?: boolean;
  text?: string;
}) => {
  // Log when visibility or text changes
  useEffect(() => {
    console.log("[Loader] visible:", visible, "text:", text);
  }, [visible, text]);

  // MAUI analogy:
  //   if (!IsBusy) return;
  if (!visible) return null;

  return (
    <View style={s.overlay}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={s.txt}>{text}</Text>
    </View>
  );
};

// ============================================================================
// STYLESHEET
// ----------------------------------------------------------------------------
// The overlay blocks all touches using absolute fill.
// Background is semi‑transparent to dim content underneath.
// ============================================================================
const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  txt: {
    marginTop: 10,
    color: "#0F5D2F",
    fontWeight: "700",
  },
});