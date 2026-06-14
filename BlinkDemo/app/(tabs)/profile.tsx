// ============================================================================
// FILE: app/(tabs)/profile.tsx
// PATH: app/(tabs)/profile.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// Profile screen for the authenticated user. Shows basic immutable user info
// (name, mobile, email) and provides quick actions like **Manage Addresses**,
// **Theme switch**, **Help & Support** (placeholder), **About** (placeholder),
// and **Logout**.
//
// CLEAN ARCHITECTURE ROLE (Project Blueprint)
// ----------------------------------------------------------------------------
// ✔ UI LAYER (this file)
//    - Pure render + event handlers
//    - No direct API calls
//    - Dispatches logout thunk; navigation/redirect is handled elsewhere
//
// ✔ STATE LAYER (Redux)
//    - Reads `auth.user` (immutable display data)
//    - Dispatches `logoutThunk()` (auth slice handles cleanup)
//
// ✔ THEME LAYER
//    - Reads `ThemeContext` for dynamic colors & mode
//    - `toggleTheme()` switches light/dark (persisted by ThemeContext)
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
//   ContentPage
//     ├── Label: Name/Mobile/Email (read-only)
//     ├── StackLayout: Quick Actions (like ListView of Menu Items)
//     ├── Switch: Theme toggle
//     └── Button: Logout (with DisplayAlert confirm)
//
// NAVIGATION RULES
// ----------------------------------------------------------------------------
// - Manage Addresses → /profile/addresses
// - Logout → dispatch only; **do not navigate**. Index gate handles redirect.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tag: [ProfileScreen]
// - Lifecycle: mount/unmount
// - Handlers: onLogout (tap + confirm), onGoAddresses, onToggleTheme
// - Menu building: one-time log when menu model constructed
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import { logoutThunk } from "../../src/store/slices/authSlice";

import { spacing } from "../../src/theme/spacing";
import { common } from "../../src/theme/common";
import { txt } from "../../src/components/common/CommonText";
import { useTheme } from "../../src/theme/ThemeContext";

type MenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { mode, colors, toggleTheme } = useTheme();

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[ProfileScreen] mounted");
    return () => {
      console.log("[ProfileScreen] unmounted");
    };
  }, []);

  const isDark = mode === "dark";
  const themeLabel = useMemo(() => (isDark ? "Dark" : "Light"), [isDark]);

  const user = useAppSelector((s: any) => s.auth.user) as
    | { id: string; name: string; mobile: string; email?: string }
    | null;

  const name = user?.name ?? "User";
  const mobile = user?.mobile ?? "-";
  const email = user?.email ?? "-";

  // ❗LOGOUT: dispatch only; DO NOT navigate. index.tsx handles Redirect.
  const onLogout = useCallback(() => {
    console.log("[ProfileScreen] Logout tapped");
    Alert.alert("Logout", "Do you want to logout?", [
      { text: "Cancel", style: "cancel", onPress: () => console.log("[ProfileScreen] Logout cancelled") },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          console.log("[ProfileScreen] Logout confirmed → dispatch logoutThunk");
          await dispatch(logoutThunk());
          // No router.replace here. Avoids duplicate redirects.
        },
      },
    ]);
  }, [dispatch]);

  const onGoAddresses = useCallback(() => {
    console.log("[ProfileScreen] Navigate → /profile/addresses");
    router.push("/profile/addresses");
  }, [router]);

  const onToggleTheme = useCallback(() => {
    console.log("[ProfileScreen] toggleTheme() current mode:", mode);
    toggleTheme();
  }, [toggleTheme, mode]);

  const menu = useMemo<MenuItem[]>(
    () => {
      const m: MenuItem[] = [
        {
          id: "addr",
          title: "Manage Addresses",
          subtitle: "Add, edit, remove, set default",
          icon: "location-outline",
          onPress: onGoAddresses,
        },
        {
          id: "theme",
          title: "Theme",
          subtitle: "Switch light / dark",
          icon: "moon-outline",
          onPress: onToggleTheme,
        },
        {
          id: "help",
          title: "Help & Support",
          subtitle: "Placeholder (no navigation yet)",
          icon: "help-circle-outline",
          onPress: () => {
            console.log("[ProfileScreen] Help & Support tapped (placeholder)");
          },
        },
        {
          id: "about",
          title: "About App",
          subtitle: "Placeholder (no navigation yet)",
          icon: "information-circle-outline",
          onPress: () => {
            console.log("[ProfileScreen] About App tapped (placeholder)");
          },
        },
        {
          id: "logout",
          title: "Logout",
          subtitle: "Sign out from this device",
          icon: "log-out-outline",
          onPress: onLogout,
        },
      ];
      console.log("[ProfileScreen] menu model constructed:", m.map(x => x.id).join(","));
      return m;
    },
    [onGoAddresses, onLogout, onToggleTheme]
  );

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ---------------------------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={[common.screen, { backgroundColor: colors.bg }]}>
      <View style={common.container}>
        <Text style={[txt.h1, { color: colors.text }]}>Profile</Text>

        {/* USER INFO CARD (read-only) */}
        <View style={styles.card}>
          <Text style={styles.smallNote}>Non editable once registered</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value} numberOfLines={1}>
              {name}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Mobile</Text>
            <Text style={styles.value} numberOfLines={1}>
              {mobile}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={[txt.h2, { marginTop: spacing.lg, color: colors.text }]}>
          Quick Actions
        </Text>

        <View style={styles.menuWrap}>
          {menu.map((m, idx) => {
            const isLast = idx === menu.length - 1;

            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  console.log("[ProfileScreen] menu press:", m.id);
                  m.onPress();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { opacity: 0.85 },
                  isLast && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.left}>
                  <Ionicons name={m.icon} size={20} color={colors.text} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.menuTitle}>{m.title}</Text>

                      {m.id === "theme" ? (
                        <View style={styles.themeRight}>
                          <Text style={styles.rightText}>{themeLabel}</Text>
                          <Switch
                            value={isDark}
                            onValueChange={() => {
                              console.log("[ProfileScreen] theme switch toggled");
                              onToggleTheme();
                            }}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.card}
                          />
                        </View>
                      ) : null}
                    </View>

                    {!!m.subtitle && (
                      <Text style={styles.menuSub}>{m.subtitle}</Text>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    smallNote: {
      color: colors.muted,
      fontSize: 12,
      marginBottom: spacing.sm,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
    },
    value: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "800",
      flex: 1,
      textAlign: "right",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    menuWrap: {
      marginTop: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    menuItem: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    menuTitle: {
      color: colors.text,
      fontWeight: "900",
      fontSize: 14,
    },
    themeRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    rightText: {
      color: colors.primary,
      fontWeight: "900",
      fontSize: 12,
    },
    menuSub: {
      color: colors.muted,
      marginTop: 2,
      fontSize: 12,
    },
  });