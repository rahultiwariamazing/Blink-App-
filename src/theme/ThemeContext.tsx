// ============================================================================
// FILE: src/theme/ThemeContext.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// Provides the **global dynamic theme system** (light/dark) for the app.
//
// Responsibilities:
//   ✔ Expose `mode` ("light" | "dark")
//   ✔ Expose `colors` palette (derived from mode)
//   ✔ Persist theme selection in AsyncStorage
//   ✔ Provide `toggleTheme()` and `setThemeMode()` APIs
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UI FOUNDATION LAYER
//     - Centralized theme source for all screens/components
//     - No business logic
//     - Ensures consistent tokens (colors, spacing via other modules)
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// This mirrors **Application.Current.Resources** with DynamicResource switching.
// Think of:
//   - A ResourceDictionary for Light and Dark
//   - A toggle that switches merged dictionaries at runtime
//
// USAGE PATTERN (IMPORTANT)
// ----------------------------------------------------------------------------
// In screens/components, always use:
//     const { colors, mode } = useTheme();
//     const common = useMemo(() => createCommon(colors), [colors]);
//     const styles = useMemo(() => makeStyles(colors, mode), [colors, mode]);
//
// Never import raw colors directly in screens (only in low-level shared components).
//
// PERSISTENCE
// ----------------------------------------------------------------------------
// Theme mode is saved to AsyncStorage under key: @blinkdemo_theme_mode
// Restored on app start (similar to reading Preferences in MAUI).
// ============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { darkColors, lightColors, type AppColors } from "./colors";

export type ThemeMode = "light" | "dark";

type ThemeValue = {
  mode: ThemeMode;
  colors: AppColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

// Persist key used across the app (matches Master Prompt)
const STORAGE_KEY = "@blinkdemo_theme_mode";

// Create context with typed value
const ThemeContext = createContext<ThemeValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ----------------------------------------------------------------------------
// Wraps the entire app (see app/_layout.tsx). Restores persisted theme mode
// on mount and updates `colors` whenever `mode` changes.
// ============================================================================
export const ThemeProvider = React.memo(function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // MAUI: Application.Current.Resources theme switching equivalent
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    // MAUI: OnStart -> load persisted settings
    let mounted = true;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        if (saved === "light" || saved === "dark") {
          setMode(saved);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Explicitly set mode and persist it
  const setThemeMode = useCallback(async (next: ThemeMode) => {
    setMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  // Toggle command (light <-> dark)
  const toggleTheme = useCallback(() => {
    // MAUI: ICommand (ToggleThemeCommand)
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    void setThemeMode(next);
  }, [mode, setThemeMode]);

  // Derived color palette based on current mode
  const colors = useMemo(() => {
    // MAUI: DynamicResource resolving based on theme
    return mode === "dark" ? darkColors : lightColors;
  }, [mode]);

  // Stable context value
  const value = useMemo<ThemeValue>(() => {
    return { mode, colors, toggleTheme, setThemeMode };
  }, [mode, colors, toggleTheme, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
});

// ============================================================================
// HOOK
// ----------------------------------------------------------------------------
// Consumers must be inside ThemeProvider; otherwise throws (dev-friendly).
// ============================================================================
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};