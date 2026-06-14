// ============================================================================
// FILE: src/components/CartBadge.tsx
//
// PURPOSE OF THIS COMPONENT
// ----------------------------------------------------------------------------
// Displays a cart icon in the header with a quantity badge.
//
// Responsibilities:
//   ✔ Shows cart icon (Ionicons)
//   ✔ Shows a numeric badge only when cart count > 0
//   ✔ Handles navigation to cart tab when pressed
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UI COMPONENT LAYER (Pure UI)
//     - No business logic
//     - Reads cart count from Redux selector (selectCartCount)
//     - Triggers navigation action only
//
// ✔ STATE LAYER USAGE
//     - selectCartCount provides global cart quantity
//     - Component is read‑only, does not mutate store
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// Maps to a **ToolbarItem with a Badge**:
//
//   <ToolbarItem IconImageSource="cart.png"
//                Command="{Binding GoToCartCommand}" />
//   <BadgeView Value="{Binding CartCount}" />
//
// Navigation:
//   Shell.Current.GoToAsync("//tabs/cart");
//
// THEME INTEGRATION
// ----------------------------------------------------------------------------
// Fully dynamic using ThemeContext:
//     const { colors } = useTheme();
//
// Badge + icon adapt automatically to light/dark mode.
//
// UX NOTES
// ----------------------------------------------------------------------------
// - hitSlop expands tap area for header usability
// - Large counts (100+) collapse into "99+" to avoid layout issues
//
// LOGGING STRATEGY (Non‑invasive, console‑only)
// ----------------------------------------------------------------------------
// Tag: [CartBadge]
// - Logs on each render when count changes
// - Logs onPress navigation request
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No UI changes, no logic modifications
// - Only added documentation + safe logs
// ============================================================================

import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppSelector } from "../store/hooks";
import { selectCartCount } from "../store/slices/cartSlice";

import { spacing } from "../theme/spacing";
import { useTheme } from "../theme/ThemeContext";

export default function CartBadge() {
  const router = useRouter();
  const { colors } = useTheme();

  // Dynamic styles based on theme
  const s = useMemo(() => makeStyles(colors), [colors]);

  // Global cart quantity
  const count = useAppSelector(selectCartCount);

  // prevent badge overflow
  const label = count > 99 ? "99+" : String(count);

  // Log changes
  useEffect(() => {
    console.log("[CartBadge] render → cartCount:", count);
  }, [count]);

  const handlePress = () => {
    console.log("[CartBadge] navigate → /(tabs)/cart");
    router.navigate("/(tabs)/cart");
  };

  return (
    <Pressable
      style={s.btn}
      hitSlop={10}
      onPress={handlePress}
    >
      {/* Theme-aware cart icon */}
      <Ionicons name="cart-outline" size={24} color={colors.primary} />

      {count > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ============================================================================
// STYLESHEET
// ----------------------------------------------------------------------------
// Unique badge positioning requires local styles.
// Theme colors ensure full dark/light support.
// ============================================================================
const makeStyles = (colors: any) =>
  StyleSheet.create({
    btn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    badge: {
      position: "absolute",
      right: spacing.md,
      top: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeTxt: {
      color: colors.onPrimary,
      fontSize: 11,
      fontWeight: "700",
    },
  });