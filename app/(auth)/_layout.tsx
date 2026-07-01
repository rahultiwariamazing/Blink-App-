// ============================================================================
// FILE: app/(auth)/_layout.tsx
// PATH: app/(auth)/_layout.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This file defines the **navigation layout for all Auth screens** such as
// Login and Signup. In Expo Router, every folder can have its own "_layout.tsx"
// which works similarly to a **Shell route group** in .NET MAUI.
//
// • Controls header appearance
// • Defines how back button behaves
// • Hosts the auth-only navigation stack
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UI Routing Layer (this file)
//    - Only responsible for navigation container for auth flow
//    - No business logic, no API calls, no state management
//    - Purely structural configuration for the (auth) group
//
// ✔ Theme Integration
//    - Reads the current theme from ThemeContext
//    - Applies colors to header for visual consistency across auth screens
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// In MAUI Shell:
//
//   <Shell>
//       <ShellContent Route="Login"  ContentTemplate="{DataTemplate LoginPage}"  />
//       <ShellContent Route="Signup" ContentTemplate="{DataTemplate SignupPage}" />
//   </Shell>
//
// Header styling here ≈ Shell.NavBar settings in MAUI.
//
// NAVIGATION BEHAVIOR
// ----------------------------------------------------------------------------
// - headerBackVisible: false → no default back button
// - iOS can still use system swipe-to-go-back where appropriate
// - Android gets no back button (headerLeft: null)
// - Ensures Login & Signup behave like "root" pages of the auth flow
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tag: [AuthLayout]
// - Lifecycle: mount/unmount
// - Render/events: theme color application, platform-specific headerLeft
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useEffect, useMemo } from "react";
import { Stack } from "expo-router";
import { Platform } from "react-native";

import { useTheme } from "../../src/theme/ThemeContext";

export default function AuthLayout() {
  // Dynamic theme: automatically updates on theme switch
  const { colors } = useTheme();

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[AuthLayout] mounted");
    return () => {
      console.log("[AuthLayout] unmounted");
    };
  }, []);

  // Memoize screenOptions to avoid recreating the object each render
  const screenOptions = useMemo(() => {
    console.log("[AuthLayout] computing screenOptions with theme colors:", {
      primary: colors?.primary,
    });
    return {
      headerShown: true,
      headerBackVisible: false,
      headerTintColor: colors.primary, // Title/icon tint
      headerStyle: { backgroundColor: colors.primary }, // Header background
      headerTitleStyle: { color: colors.primary }, // Title color
      headerLeft: Platform.OS === "ios" ? undefined : () => null, // Hide back on Android
    } as const;
  }, [colors, colors?.primary]);

  return (
    <Stack screenOptions={screenOptions}>
      {/* MAUI: <ShellContent Route="Login" ... /> */}
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
          // Logging is inside options to trace when options are resolved by router
          // (Router may call this during layout evaluation)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // ts-expect-error: dev-only console in options block
          // keeping console harmless for prod (removed by bundlers in prod if configured)
          headerTitle: (() => {
            console.log("[AuthLayout] screen option resolved: login");
            return undefined as unknown as string;
          })(),
        }}
      />
      {/* MAUI: <ShellContent Route="Signup" ... /> */}
      <Stack.Screen
        name="signup"
        options={{
          title: "Create Account",
          // see note above for dev trace
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // ts-expect-error
          headerTitle: (() => {
            console.log("[AuthLayout] screen option resolved: signup");
            return undefined as unknown as string;
          })(),
        }}
      />
    </Stack>
  );
}