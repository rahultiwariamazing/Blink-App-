// ============================================================================
// FILE: src/components/Toast/ToastProvider.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This component provides a GLOBAL toast notification system for the entire app.
// Any screen or service can trigger a toast message using:
//       showToast("Message", { type: "success" });
//
// Features:
//   ✔ Global toast context (React Context)
//   ✔ Animated appearance / disappearance
//   ✔ Success / Error / Info variants
//   ✔ Auto-hide after duration
//   ✔ Global registration via setGlobalToast() for use outside React tree
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UI FOUNDATION LAYER (Cross‑App Component)
//    - Provides standardized toast UX for all screens
//    - Does not contain business logic
//    - Completely reusable and theme-aware
//
// ✔ Global Integration
//    - Registered via setGlobalToast(showToast)
//    - Allows ANY layer (API client, service, ViewModel) to trigger toast
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// In MAUI, this is similar to:
//   App.Current.MainPage.DisplayToastAsync("Saved", 2000);
//
// Animation equivalent:
//   - Fade + Translate animation = View.FadeTo() + TranslateTo()
//
// THEME INTEGRATION
// ----------------------------------------------------------------------------
// Adapts to theme via ThemeContext:
//     const { colors } = useTheme();
//
// ABOUT THE ANIMATION SYSTEM
// ----------------------------------------------------------------------------
// - Uses Animated.Value for opacity + translateY
// - Animations are token‑tracked to avoid race conditions
// - Ensures smooth cross‑fade when multiple toasts appear rapidly
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [ToastProvider]
// - Lifecycle: mount/unmount
// - Registration: setGlobalToast() setup
// - Actions: showToast() calls with type/duration, hideNow() triggers
// - Animation: token increments, schedule/cancel timers
// - State: visible toggles
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No changes to logic, timing, or styles.
// - Only added comments + console logs.
// ============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { spacing } from "../../theme/spacing";
import { setGlobalToast } from "../../utils/globalToast";

type ToastType = "success" | "info" | "error";

type ShowToastOptions = {
  durationMs?: number;
  type?: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, options?: ShowToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ============================================================================
// PROVIDER COMPONENT
// ----------------------------------------------------------------------------
// Wraps the entire app (inside RootLayout) to supply toast functionality.
// ============================================================================
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Toast State
  const [message, setMessage] = useState<string>("");
  const [type, setType] = useState<ToastType>("info");
  const [visible, setVisible] = useState(false);

  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  // Timer + race condition safety token
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTokenRef = useRef(0);

  // Lifecycle logs
  useEffect(() => {
    console.log("[ToastProvider] mounted");
    return () => {
      console.log("[ToastProvider] unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[ToastProvider] visible:", visible, "type:", type);
  }, [visible, type]);

  // ==========================================================================
  // HIDE TOAST (FADE OUT)
  // ==========================================================================
  const hideNow = useCallback(() => {
    animTokenRef.current += 1;
    const token = animTokenRef.current;
    console.log("[ToastProvider] hideNow() token:", token);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 16,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        console.log("[ToastProvider] hide animation interrupted");
        return;
      }
      if (token !== animTokenRef.current) {
        console.log("[ToastProvider] hide token mismatch; abort setVisible(false)");
        return;
      }
      setVisible(false);
      console.log("[ToastProvider] hidden");
    });
  }, [opacity, translateY]);

  // ==========================================================================
  // SHOW TOAST (ANIMATED)
  // ==========================================================================
  const showToast = useCallback(
    (msg: string, options?: ShowToastOptions) => {
      const durationMs = options?.durationMs ?? 2000;
      const nextType = options?.type ?? "info";

      console.log("[ToastProvider] showToast()", {
        msg,
        durationMs,
        type: nextType,
      });

      // Cancel existing timeout if toast is triggered again quickly
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
        console.log("[ToastProvider] cleared previous hide timer");
      }

      animTokenRef.current += 1;
      const token = animTokenRef.current;
      console.log("[ToastProvider] show token:", token);

      setMessage(msg);
      setType(nextType);
      setVisible(true);

      // Reset animations
      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(0);
      translateY.setValue(16);

      // Fade in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          console.log("[ToastProvider] show animation interrupted");
          return;
        }
        if (token !== animTokenRef.current) {
          console.log("[ToastProvider] show token mismatch; skip scheduling hide");
          return;
        }

        // Schedule hide
        hideTimerRef.current = setTimeout(() => hideNow(), durationMs);
        console.log("[ToastProvider] hide scheduled in ms:", durationMs);
      });
    },
    [hideNow, opacity, translateY]
  );

  // ==========================================================================
  // MAKE TOAST AVAILABLE GLOBALLY
  // ==========================================================================
  useEffect(() => {
    console.log("[ToastProvider] registering global toast function");
    setGlobalToast(showToast);
  }, [showToast]);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  // Select variant style
  const barStyle = useMemo(() => {
    if (type === "success") return styles.barSuccess;
    if (type === "error") return styles.barError;
    return styles.barInfo;
  }, [styles, type]);

  // ==========================================================================
  // RENDER PROVIDER + TOAST UI
  // ==========================================================================
  return (
    <ToastContext.Provider value={value}>
      {children}

      {visible ? (
        <View pointerEvents="none" style={styles.overlay}>
          <Animated.View
            style={[
              styles.toast,
              barStyle,
              { opacity, transform: [{ translateY }] },
            ]}
          >
            <Text numberOfLines={2} style={styles.toastText}>
              {message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

// ============================================================================
// STYLESHEET
// ----------------------------------------------------------------------------
// Uses theme-based colors only.
// Toast is anchored at the bottom of the screen, centered horizontally.
// ============================================================================
const makeStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    toast: {
      width: "100%",
      maxWidth: 520,
      borderRadius: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },

    // VARIANTS (Info / Success / Error)
    barInfo: {
      borderLeftWidth: 6,
      borderLeftColor: colors.primary,
    },
    barSuccess: {
      borderLeftWidth: 6,
      borderLeftColor: colors.success ?? colors.primary,
    },
    barError: {
      borderLeftWidth: 6,
      borderLeftColor: colors.danger,
    },

    toastText: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 13,
    },
  });