// ============================================================================
// FILE: app/profile/addresses.tsx
// PATH: app/profile/addresses.tsx
//
// CHANGE SUMMARY
// ----------------------------------------------------------------------------
// - Safe header: Back button + title + Add Address (no notch overlap).
// - Simplified UX: Selected address === Default address (single concept).
// - Tapping a card → selects it AND makes it default (optimistic + service call).
// - Removed “Default/Set Default” controls; show only a subtle “Selected” tag.
// - Auto-default rules on load and after delete:
//     • If only 1 address and not default → make it default (service call).
//     • If multiple addresses and none default → make the first one default.
//     • If default is deleted → make the first remaining default.
// - Helper hint under header: “Tap a card to choose your delivery address…”
// - Kept existing logs and behavior otherwise.
// ============================================================================

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "../../src/theme/spacing";
import { createCommon } from "../../src/theme/common";
import { useTheme } from "../../src/theme/ThemeContext";
import { txt } from "../../src/components/common/CommonText";
import { Loader } from "../../src/components/Loader";

import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import type { UserAddress } from "../../src/models/address";
import {
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
} from "../../src/services/addressApi";
import { setSelectedAddressId } from "../../src/store/slices/deliverySlice";

type AuthUser = { id: string; name: string; mobile: string; email?: string } | null;

// ============================================================================
// ADDRESS ROW COMPONENT
// ============================================================================
const AddressRow = React.memo(function AddressRow(props: {
  item: UserAddress;
  disabled?: boolean;
  isSelected?: boolean;
  onSelect: (a: UserAddress) => void;
  onEdit: (a: UserAddress) => void;
  onDelete: (a: UserAddress) => void;
  colors: any;
  common: any;
  blockCardPressRef: React.MutableRefObject<boolean>;
}) {
  const {
    item,
    disabled,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    colors,
    common,
    blockCardPressRef,
  } = props;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const blockCardOnce = () => {
    console.log("[AddressRow] blockCardOnce set for 250ms");
    blockCardPressRef.current = true;
    setTimeout(() => (blockCardPressRef.current = false), 250);
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        console.log("[AddressRow] card press → onSelect:", item.id);
        onSelect(item);
      }}
      style={({ pressed }) => [
        common.card,
        styles.rowCard,
        pressed && !disabled && { opacity: 0.92 },
        disabled && styles.disabled,
        isSelected && styles.selectedCard,
      ]}
    >
      {/* TOP ROW — LABEL + CITY + PINCODE */}
      <View style={common.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            {item.label}
            {isSelected ? "  •  Selected" : ""}
          </Text>

          <Text style={styles.addr} numberOfLines={2}>
            {item.addressLine}
          </Text>

          <Text style={styles.meta}>
            {item.city} - {item.pincode}
          </Text>
        </View>

        {/* ICONS */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          ) : null}

          <Pressable
            disabled={disabled}
            onPressIn={blockCardOnce}
            onPress={() => {
              console.log("[AddressRow] edit press → onEdit:", item.id);
              onEdit(item);
            }}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && !disabled && { opacity: 0.85 },
              disabled && styles.disabled,
            ]}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* BUTTON ROW — ONLY DELETE (Default/Set Default removed) */}
      <View style={[common.rowBetween, { marginTop: spacing.sm }]}>
        <View />{/* spacer to keep layout balanced */}
        <Pressable
          disabled={disabled}
          onPressIn={blockCardOnce}
          onPress={() => {
            console.log("[AddressRow] delete press → onDelete:", item.id);
            onDelete(item);
          }}
          style={({ pressed }) => [
            styles.chipDanger,
            pressed && !disabled && { opacity: 0.85 },
            disabled && styles.disabled,
          ]}
        >
          <Text style={styles.chipDangerText}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

// ============================================================================
// MAIN SCREEN — ADDRESSES PAGE
// ============================================================================
export default function AddressesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const common = useMemo(() => createCommon(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const dispatch = useAppDispatch();
  const blockCardPressRef = useRef(false);
  const lastLoadIdRef = useRef(0);

  const user = useAppSelector((s: any) => s.auth.user) as AuthUser;
  const userId = user?.id ?? "u1"; // fallback for dev

  const selectedAddressId = useAppSelector(
    (s: any) => s.delivery?.selectedAddressId
  ) as string | null;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UserAddress[]>([]);

  // Safe top padding (no statusbar overlap)
  const safeTop = Math.max(insets.top, 8);

  // Lifecycle logs
  useEffect(() => {
    console.log("[AddressesScreen] mounted");
    return () => {
      console.log("[AddressesScreen] unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[AddressesScreen] selectedAddressId changed:", selectedAddressId);
  }, [selectedAddressId]);

  // -------------------------------------------------------------
  // Helper: ensure one-and-only-one default + selection on list
  // -------------------------------------------------------------
  const ensureDefaultAndSelection = useCallback(
    async (list: UserAddress[]) => {
      if (list.length === 0) {
        console.log("[AddressesScreen] ensureDefault: empty list");
        dispatch(setSelectedAddressId(null));
        return;
      }

      // Prefer current default from server
      const currentDefault = list.find((x) => x.isDefault);

      if (list.length === 1) {
        const only = list[0];
        if (!only.isDefault) {
          console.log("[AddressesScreen] ensureDefault: single non-default → set default:", only.id);
          // optimistic: mark as default locally
          setRows((prev) => prev.map((x) => ({ ...x, isDefault: x.id === only.id })));
          try {
            const res = await setDefaultAddress(userId, only.id);
            if (!res.ok) Alert.alert("Error", res.message);
          } catch (e) {
            console.log("[AddressesScreen] ensureDefault single error:", e);
          }
        }
        dispatch(setSelectedAddressId(only.id));
        return;
      }

      // Multiple addresses
      if (currentDefault) {
        console.log("[AddressesScreen] ensureDefault: existing default:", currentDefault.id);
        dispatch(setSelectedAddressId(currentDefault.id));
        return;
      }

      // No default at all → choose the first item
      const first = list[0];
      console.log("[AddressesScreen] ensureDefault: no default → making first default:", first.id);

      // optimistic local update
      setRows((prev) => prev.map((x) => ({ ...x, isDefault: x.id === first.id })));
      dispatch(setSelectedAddressId(first.id));
      try {
        const res = await setDefaultAddress(userId, first.id);
        if (!res.ok) Alert.alert("Error", res.message);
      } catch (e) {
        console.log("[AddressesScreen] ensureDefault multi error:", e);
      }
    },
    [dispatch, userId]
  );

  // LOAD ADDRESS LIST
  const load = useCallback(
    async (showLoader: boolean = true) => {
      const loadId = ++lastLoadIdRef.current;
      console.log("[AddressesScreen] load() start", { loadId, showLoader, userId });
      if (showLoader) setLoading(true);

      try {
        const res = await fetchAddresses(userId);
        if (loadId !== lastLoadIdRef.current) {
          console.log("[AddressesScreen] stale load ignored:", { loadId });
          return;
        }

        if (!res.ok) {
          console.log("[AddressesScreen] fetchAddresses not ok:", res.message);
          Alert.alert("Error", res.message);
          setRows([]);
          dispatch(setSelectedAddressId(null));
          return;
        }

        const data = res.data ?? [];
        console.log("[AddressesScreen] fetchAddresses success; rows:", data.length);
        setRows(data);

        // Enforce unified default/selection rules
        await ensureDefaultAndSelection(data);
      } finally {
        if (loadId === lastLoadIdRef.current && showLoader) {
          setLoading(false);
          console.log("[AddressesScreen] load() end", { loadId });
        }
      }
    },
    [dispatch, ensureDefaultAndSelection, userId]
  );

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log("[AddressesScreen] focus → triggering load()");
      void load(true);
      return () => {
        console.log("[AddressesScreen] blur (focus cleanup)");
      };
    }, [load])
  );

  // ADDRESS ACTION HANDLERS

  // Tap → select + make default
  const onSelect = useCallback(
    async (a: UserAddress) => {
      if (blockCardPressRef.current) {
        console.log("[AddressesScreen] onSelect blocked by blockCardPressRef");
        return;
      }
      if (loading) {
        console.log("[AddressesScreen] onSelect ignored: loading true");
        return;
      }

      console.log("[AddressesScreen] onSelect → set default:", a.id);
      // optimistic local update
      setRows((prev) => prev.map((x) => ({ ...x, isDefault: x.id === a.id })));
      dispatch(setSelectedAddressId(a.id));

      setLoading(true);
      try {
        const res = await setDefaultAddress(userId, a.id);
        if (!res.ok) {
          console.log("[AddressesScreen] setDefaultAddress not ok:", res.message);
          Alert.alert("Error", res.message);
        }
      } catch (e) {
        console.log("[AddressesScreen] onSelect error:", e);
      } finally {
        setLoading(false);
        // Preserve previous behavior: go back after selection
        router.back();
      }
    },
    [dispatch, loading, router, userId]
  );

  const onAdd = useCallback(() => {
    console.log("[AddressesScreen] onAdd → /profile/address-form?mode=add");
    router.push({ pathname: "/profile/address-form", params: { mode: "add" } });
  }, [router]);

  const onEdit = useCallback(
    (a: UserAddress) => {
      console.log("[AddressesScreen] onEdit → /profile/address-form?mode=edit&id=", a.id);
      router.push({
        pathname: "/profile/address-form",
        params: { mode: "edit", id: a.id },
      });
    },
    [router]
  );

  const onDelete = useCallback(
    (a: UserAddress) => {
      if (loading) {
        console.log("[AddressesScreen] onDelete ignored: loading true");
        return;
      }

      Alert.alert("Delete", "Remove this address?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log("[AddressesScreen] deleting address:", a.id);
            setLoading(true);
            try {
              const res = await deleteAddress(a.id);
              if (!res.ok) {
                console.log("[AddressesScreen] deleteAddress not ok:", res.message);
                return Alert.alert("Error", res.message);
              }

              // Reload list → ensure default/selection in load()
              await load(false);
            } finally {
              setLoading(false);
              console.log("[AddressesScreen] delete flow end");
            }
          },
        },
      ]);
    },
    [load, loading]
  );

  // RENDERERS
  const renderItem = useCallback(
    ({ item }: { item: UserAddress }) => (
      <AddressRow
        item={item}
        disabled={loading}
        isSelected={selectedAddressId === item.id}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        colors={colors}
        common={common}
        blockCardPressRef={blockCardPressRef}
      />
    ),
    [onSelect, onEdit, onDelete, loading, selectedAddressId, colors, common]
  );

  const keyExtractor = useCallback((item: UserAddress) => item.id, []);

  const empty = useMemo(
    () => (
      <View style={{ marginTop: spacing.xl }}>
        <Text style={[txt.p, { color: colors.text }]}>No addresses yet.</Text>
        <Text style={[txt.p, { color: colors.muted, marginTop: spacing.xs }]}>
          Tap “Add Address” to create one.
        </Text>
      </View>
    ),
    [colors.muted, colors.text]
  );

  // UI
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }]} edges={["top", "bottom"]}>
      <View style={[common.container, { paddingTop: safeTop }]}>
        {/* HEADER ROW: [Back + Title] …… [Add Address] */}
        <View style={[styles.headerRow]}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                console.log("[AddressesScreen] back press");
                router.back();
              }}
              hitSlop={10}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>

            <Text style={[txt.h1, { color: colors.text }]} numberOfLines={1}>
              Addresses
            </Text>
          </View>

          <Pressable
            disabled={loading}
            onPress={onAdd}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && !loading && { opacity: 0.9 },
              loading && styles.disabled,
            ]}
          >
            <Ionicons name="add" size={18} color={colors.textOnPrimary} />
            <Text style={styles.addBtnText}>Add Address</Text>
          </Pressable>
        </View>

        {/* Helper hint */}
        <Text style={[styles.hint, { color: colors.muted }]}>
          Tap a card to choose your delivery address (it becomes your default).
        </Text>

        {/* ADDRESS LIST */}
        <FlatList
          data={rows}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: spacing.xl,
            flexGrow: rows.length ? 0 : 1,
          }}
          ListEmptyComponent={() => empty}
          keyboardShouldPersistTaps="handled"
        />

        <Loader visible={loading} />
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET
// ============================================================================
const makeStyles = (colors: any) =>
  StyleSheet.create({
    // Header
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexShrink: 1,
    },
    backBtn: {
      height: 36,
      width: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    hint: {
      marginBottom: spacing.md,
      fontSize: 12,
      fontWeight: "700",
    },

    rowCard: { marginBottom: spacing.md },
    selectedCard: { borderColor: colors.primary },
    label: { color: colors.text, fontWeight: "900", fontSize: 13 },
    addr: { color: colors.text, marginTop: spacing.xs, fontSize: 13 },
    meta: { color: colors.muted, marginTop: 2, fontSize: 12 },
    iconBtn: { padding: spacing.sm },

    addBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    addBtnText: { color: colors.textOnPrimary, fontWeight: "900" },

    chipDanger: {
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 999,
    },
    chipDangerText: {
      color: colors.danger,
      fontWeight: "900",
      fontSize: 12,
    },

    disabled: { opacity: 0.6 },
  });