// src/theme/common.ts
import { StyleSheet } from "react-native";
import { colors as defaultColors, type AppColors } from "./colors";
import { spacing } from "./spacing";

/**
 * MAUI mapping:
 * - ResourceDictionary styles -> createCommon(themeColors)
 * - DynamicResource -> pass current theme colors
 */

export const createCommon = (colors: AppColors) =>
  StyleSheet.create({
    // existing (keep)
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    card: {
      backgroundColor: colors.card,
      padding: spacing.md,
      borderRadius: 12,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // added (auth/form)
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      marginTop: spacing.sm,
    },

    input: {
      backgroundColor: colors.inputBg,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },

    inputRow: {
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
    },

    inputFlex: {
      flex: 1,
      color: colors.text,
      paddingVertical: spacing.md,
    },

    pwdToggle: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.sm,
    },

    inputError: {
      borderColor: colors.danger,
    },

    errorText: {
      color: colors.danger,
      fontSize: 12,
      marginTop: spacing.xs,
    },

    errorTop: {
      color: colors.danger,
      marginTop: spacing.sm,
    },

    linkText: {
      color: colors.link,
      fontWeight: "600",
    },

    centerLink: {
      alignItems: "center",
      marginTop: spacing.sm,
    },

    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: 10,
      alignItems: "center",
      marginTop: spacing.md,
    },

    primaryButtonDisabled: {
      opacity: 0.6,
    },

    primaryButtonText: {
      color: colors.textOnPrimary,
      fontWeight: "700",
    },

    // ✅ secondary button (used by login)
    secondaryButton: {
      backgroundColor: colors.secondary,
      paddingVertical: spacing.md,
      borderRadius: 10,
      alignItems: "center",
      marginTop: spacing.md,
    },
    secondaryButtonDisabled: {
      opacity: 0.6,
    },
    secondaryButtonText: {
      color: colors.textOnSecondary,
      fontWeight: "700",
    },

    // helper to keep ActivityIndicator consistent in screens
    activityIndicator: {
      color: colors.textOnPrimary,
    },
  });

// ✅ Backward compatible export (existing imports keep working, uses light by default)
export const common = createCommon(defaultColors);
``