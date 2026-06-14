// ============================================================================
// FILE: app/index.tsx
// PATH: app/index.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This is the **bootstrap redirect file** for Expo Router. It receives control
// *before any grouped routes* are displayed, and immediately redirects the user
// based on authentication state.
//
// WHAT IT DOES
// ----------------------------------------------------------------------------
// ✔ Waits until the navigation container is fully ready  
// ✔ Reads token from Redux  
// ✔ Redirects to:
//      - "/(tabs)/home"   if logged in
//      - "/(auth)/login"  if logged out
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// This file acts as a **Routing Layer** entry point.
// It does NOT display UI, does NOT contain business logic, and does NOT fetch
// any backend data. Only small routing redirection.
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// In .NET MAUI, this is conceptually similar to:
//
//   AppShell.xaml.cs
//     protected override void OnAppearing() {
//         if (Authenticated) GoToAsync("//Home");
//         else GoToAsync("//Login");
//     }
//
// NAVIGATION RULES
// ----------------------------------------------------------------------------
// - router.replace() ensures no back navigation to index
// - setTimeout(..., 0) avoids race conditions with RootLayout/AuthGate
//
// LOGGING STRATEGY
// ----------------------------------------------------------------------------
// Tag: [Index]
// - When navigation becomes ready
// - When token changes
// - Full redirect decision
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No UI or design changes
// - Only added logs + documentation
// - Safe to paste and run
// ============================================================================

import { useEffect } from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { useAppSelector } from "../src/store/hooks";

export default function Index() {
  const router = useRouter();
  const navReady = useRootNavigationState()?.key != null;

  const token = useAppSelector((s) => s.auth.token);
  const isLoggedIn = Boolean(token);

  // ---------------------------------------------------------------------------
  // LIFECYCLE + DECISION LOGGING
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[Index] navReady:", navReady, "isLoggedIn:", isLoggedIn);

    if (!navReady) {
      console.log("[Index] Navigation not ready → skipping redirect");
      return;
    }

    const target = isLoggedIn ? "/(tabs)/home" : "/(auth)/login";

    // Defer one tick to avoid race with _layout + AuthGate
    setTimeout(() => {
      console.log("[Index] redirecting →", target);
      router.replace(target as any);
    }, 0);
  }, [navReady, isLoggedIn, router]);

  return null;
}