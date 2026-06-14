// ============================================================================
// FILE: src/components/common/CommonCounter.tsx
//
// PURPOSE OF THIS COMPONENT
// ----------------------------------------------------------------------------
// This is a reusable **quantity selector** used across the entire app.
//
// It provides:
//   • “−” button → decrease quantity
//   • “＋” button → increase quantity
//   • Current quantity displayed in the center
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UI COMPONENT LAYER (Presentational Only)
//    - Stateless, reusable UI block
//    - Emits user intent through props (onPlus/onMinus)
//    - Parent ViewModel handles business rules, limits, API sync
//
// THEME SYSTEM (IMPORTANT)
// ----------------------------------------------------------------------------
// Uses ThemeContext dynamic palette:
//     const { colors } = useTheme();
//     const s = useMemo(() => makeStyles(colors), [colors]);
//
// No hardcoded colors → full dark/light support automatically.
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// <HorizontalStackLayout>
//     <Button Text="-" Command="{Binding MinusCommand}" />
//     <Label Text="{Binding Quantity}" />
//     <Button Text="+" Command="{Binding PlusCommand}" />
// </HorizontalStackLayout>
//
// LOGGING STRATEGY (Non-invasive, minimal)
// ----------------------------------------------------------------------------
// Tag: [CommonCounter]
// Logs:
//   • renders with qty
//   • onPlus tap
//   • onMinus tap
// ============================================================================

import React, { useMemo, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export default function CommonCounter({
  qty,
  onPlus,
  onMinus,
}: {
  qty: number;
  onPlus: () => void;
  onMinus: () => void;
}) {
  const { colors } = useTheme(); // Dynamic theme palette
  const s = useMemo(() => makeStyles(colors), [colors]);

  // Log on every render
  useEffect(() => {
    console.log("[CommonCounter] render → qty:", qty);
  }, [qty]);

  const handleMinus = () => {
    console.log("[CommonCounter] onMinus() → qty:", qty);
    onMinus();
  };

  const handlePlus = () => {
    console.log("[CommonCounter] onPlus() → qty:", qty);
    onPlus();
  };

  return (
    <View style={s.counter}>
      {/* MINUS BUTTON */}
      <TouchableOpacity style={s.step} onPress={handleMinus}>
        <Text style={s.stepTxt}>−</Text>
      </TouchableOpacity>

      {/* CURRENT QUANTITY */}
      <Text style={s.qty}>{qty}</Text>

      {/* PLUS BUTTON */}
      <TouchableOpacity style={s.step} onPress={handlePlus}>
        <Text style={s.stepTxt}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// STYLESHEET
// ----------------------------------------------------------------------------
// All colors come from ThemeContext (dynamic dark/light theming).
// ============================================================================
const makeStyles = (colors: any) =>
  StyleSheet.create({
    counter: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    step: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    stepTxt: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.primary,
    },
    qty: {
      minWidth: 26,
      textAlign: "center",
      fontWeight: "700",
      color: colors.text,
    },
  });