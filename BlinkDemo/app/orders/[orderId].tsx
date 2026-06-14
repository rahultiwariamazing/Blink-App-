// ============================================================================
// FILE: app/orders/[orderId].tsx
// PATH: app/orders/[orderId].tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This is the **Order Details Screen**.
//
// It displays:
//   • Order summary (status, created date, total amount)
//   • All purchased items with qty × price and subtotal
//
// Data is retrieved from:
//      getOrderById(orderId)
//
// CLEAN ARCHITECTURE
// ----------------------------------------------------------------------------
// ✔ UI LAYER (this file)
//    - Displays SectionList for “Summary” + “Items”
//    - Handles navigation back
//    - Uses theme and spacing from the global design system
//
// ✔ SERVICE LAYER (orderService.ts)
//    - Calls backend via global apiClient
//    - Envelope parsing
//    - Model transformation (PascalCase → camelCase)
//
// ✔ STATE LAYER
//    - This screen does NOT use Redux
//    - Data is fetched on-demand
//
// ✔ NAVIGATION LAYER
//    - Expo Router dynamic route: /orders/[orderId].tsx
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// This screen mirrors a MAUI:
//
//   ContentPage
//     ├── Label: "Order Details"
//     ├── CollectionView (Grouped)
//     │       Group: Summary
//     │       Group: Items
//     └── Button/Text: Back
//
// useEffect() == OnAppearing()
// useMemo()   == Computed Bindable Properties
//
// THEME SYSTEM
// ----------------------------------------------------------------------------
// Must use:
//     const { colors } = useTheme();
//     const common = useMemo(() => createCommon(colors), [colors]);
//
// No direct import of colors from palette files.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tag: [OrderDetailsScreen]
// - Lifecycle: mount/unmount
// - Effects: fetch start/end with orderId, errors
// - State: order set/null, sections recomputed
// - Handlers: back navigation tap
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { spacing } from "../../src/theme/spacing";
import { createCommon } from "../../src/theme/common";
import { useTheme } from "../../src/theme/ThemeContext";
import { txt } from "../../src/components/common/CommonText";

import { getOrderById, type Order } from "../../src/services/orderService";
import { formatINR } from "../../src/utils/currency";

// Input shapes for SectionList renderer
type SummaryRow = { key: string; label: string; value: string };
type ItemRow = { key: string; title: string; subtitle: string; value: string };

type SectionItem = SummaryRow | ItemRow;

type SectionShape = {
  title: string;
  type: "summary" | "items";
  data: SectionItem[];
};

export default function OrderDetails() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  // Theme
  const { colors } = useTheme();
  const common = useMemo(() => createCommon(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Local state for the order
  const [order, setOrder] = useState<Order | null>(null);

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[OrderDetailsScreen] mounted with orderId:", String(orderId));
    return () => {
      console.log("[OrderDetailsScreen] unmounted");
    };
  }, [orderId]);

  // ==========================================================================
  // FETCH ORDER DATA WHEN SCREEN APPEARS
  // MAUI Equivalent:
  //    protected override void OnAppearing() { await LoadOrder(); }
  // ==========================================================================
  useEffect(() => {
    let mounted = true;

    (async () => {
      console.log("[OrderDetailsScreen] getOrderById() start:", String(orderId));
      try {
        const result = await getOrderById(String(orderId));
        if (!mounted) return;
        setOrder(result ?? null);
        console.log(
          "[OrderDetailsScreen] getOrderById() success; has order:",
          !!result
        );
      } catch (e) {
        console.log("[OrderDetailsScreen] getOrderById() error:", e);
        if (mounted) setOrder(null);
      } finally {
        if (mounted) {
          console.log("[OrderDetailsScreen] getOrderById() end");
        }
      }
    })();

    return () => {
      mounted = false;
      console.log("[OrderDetailsScreen] fetch effect cleanup (mounted=false)");
    };
  }, [orderId]);

  useEffect(() => {
    console.log(
      "[OrderDetailsScreen] order state changed:",
      order ? "loaded" : "null"
    );
  }, [order]);

  // ==========================================================================
  // BUILD SECTION LIST DATA (useMemo = computed BindableProperty in MAUI)
  // ==========================================================================
  const sections = useMemo<SectionShape[]>(() => {
    if (!order) return [];

    const summary: SummaryRow[] = [
      { key: "status", label: "Status", value: order.status },
      {
        key: "created",
        label: "Placed On",
        value: new Date(order.createdAt).toLocaleString(),
      },
      { key: "total", label: "Total", value: formatINR(order.totalAmount) },
    ];

    const items: ItemRow[] = order.items.map((x) => ({
      key: x.id,
      title: x.productName,
      subtitle: `${x.quantity} × ${formatINR(x.priceAtPurchase)}`,
      value: formatINR(x.subtotal),
    }));

    return [
      { title: "Summary", type: "summary", data: summary },
      { title: "Items", type: "items", data: items },
    ];
  }, [order]);

  useEffect(() => {
    console.log(
      "[OrderDetailsScreen] sections recomputed:",
      sections.map((s) => `${s.title}(${s.data.length})`).join(", ")
    );
  }, [sections]);

  // ==========================================================================
  // SECTION LIST HELPERS
  // ==========================================================================
  const keyExtractor = useCallback((item: SectionItem) => item.key, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionShape }) => (
      <Text style={styles.sectionTitle}>{section.title}</Text>
    ),
    [styles.sectionTitle]
  );

  const renderItem = useCallback(
    ({ item, section }: { item: SectionItem; section: SectionShape }) => {
      if (section.type === "summary") {
        const row = item as SummaryRow;
        return (
          <View style={styles.row}>
            <Text style={[txt.muted, { flex: 1, color: colors.muted }]}>
              {row.label}
            </Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        );
      }

      const it = item as ItemRow;
      return (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.value} numberOfLines={1}>
              {it.title}
            </Text>
            <Text style={[txt.muted, { color: colors.muted }]}>{it.subtitle}</Text>
          </View>

          <Text style={styles.value}>{it.value}</Text>
        </View>
      );
    },
    [colors.muted, styles.row, styles.value]
  );

  // Back handler
  const onBack = useCallback(() => {
    console.log("[OrderDetailsScreen] back tapped → router.back()");
    router.back();
  }, [router]);

  // ==========================================================================
  // UI LAYOUT
  // ==========================================================================
  return (
    <SafeAreaView style={common.screen}>
      <View style={common.container}>
        {/* PAGE TITLE */}
        <Text style={[txt.h1, { color: colors.text }]}>Order Details</Text>

        {/* ORDER ID SHORT DISPLAY */}
        <Text style={[txt.muted, { marginTop: spacing.xs, color: colors.muted }]}>
          #{String(orderId).slice(-6).toUpperCase()}
        </Text>

        {/* IF ORDER NOT FOUND */}
        {!order ? (
          <Text style={[txt.muted, { marginTop: spacing.lg, color: colors.muted }]}>
            Order not found.
          </Text>
        ) : (
          <SectionList<SectionItem, SectionShape>
            sections={sections}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
          />
        )}

        {/* SIMPLE BACK LINK */}
        <Text onPress={onBack} style={styles.backLink}>
          Back
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET
// ============================================================================
const makeStyles = (colors: any) =>
  StyleSheet.create({
    sectionTitle: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      color: colors.text,
      fontWeight: "900",
      fontSize: 14,
    },
    row: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    value: {
      color: colors.text,
      fontWeight: "800",
    },
    backLink: {
      marginTop: spacing.md,
      color: colors.primary,
      fontWeight: "800",
      alignSelf: "center",
    },
  });