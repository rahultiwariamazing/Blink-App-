import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";

import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export default function CommonButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[s.btn, isDisabled && s.btnDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <Text style={s.txt}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  txt: {
    color: colors.textOnPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
});