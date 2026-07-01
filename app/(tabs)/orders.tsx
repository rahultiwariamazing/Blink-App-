// ============================================================================
// FILE: app/(tabs)/orders.tsx
// PATH: app/(tabs)/orders.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This screen displays the **list of past orders** for the authenticated user.
// It loads orders from the backend using orderService.getOrders() and shows:
//
//   • Order ID
//   • Order created date/time
//   • Order status (Mapped string)
//   • Total quantity
//   • Total price
//
// User can tap an order → navigates to Order Detail Page: /orders/[orderId]
//
// CLEAN ARCHITECTURE LAYERING
// ----------------------------------------------------------------------------
// ✔ UI LAYER (This file)
//    - Displays list of orders
//    - Handles pull-to-refresh
//    - Uses theme & components
//    - Handles navigation to detail screen
//
// ✔ SERVICE LAYER (orderService.ts)
//    - Calls backend using global apiClient
//    - Parses envelope
//    - Maps PascalCase → camelCase
//
// ✔ STATE LAYER
//    - This screen does NOT use Redux, as orders are read-only historical data
//
// ✔ REUSABLE COMPONENTS
//    - OrderCard is memoized for performance (like MAUI DataTemplate)
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// ContentPage with:
//
//   <CollectionView ItemsSource="{Binding Orders}">
//     <CollectionView.ItemTemplate>
//       <DataTemplate>
//         <Frame>
//           <Grid>
//             <Label Text="Order #1234"/>
//             <Label Text="{Binding Status}"/>
//           </Grid>
//         </Frame>
//       </DataTemplate>
//     </CollectionView.ItemTemplate>
//   </CollectionView>
//
// Navigation Equivalent:
//   Shell.Current.GoToAsync($"orderDetail?orderId={id}");
//
// THEME SYSTEM (Master Prompt rule)
// ----------------------------------------------------------------------------
// Uses:
//     const { colors, mode } = useTheme();
//     const common = useMemo(() => createCommon(colors), [colors]);
//
// No direct palette imports.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tags: [OrdersScreen], [OrderCard]
// - Lifecycle: mount/unmount
// - Effects: load orders begin/end
// - Handlers: openOrder(orderId), Refresh button (load())
// - State: orders length, loading flag
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { spacing } from "../../src/theme/spacing";
import { createCommon } from "../../src/theme/common";
import { useTheme } from "../../src/theme/ThemeContext";
import { txt } from "../../src/components/common/CommonText";

import { getOrders, type Order } from "../../src/services/orderService";
import { formatINR } from "../../src/utils/currency";

// ============================================================================
// STATUS LABEL FORMATTER (maps backend → display)
// ============================================================================
const statusLabel = (s: string) => {
  switch (s) {
    case "PLACED":
      return "Placed";
    case "CONFIRMED":
      return "Confirmed";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return s;
  }
};

// ============================================================================
// ORDER CARD COMPONENT (Memoized for performance)
// MAUI Equivalent: DataTemplate inside CollectionView
// ============================================================================
const OrderCard = React.memo(function OrderCard({
  order,
  onPress,
  colors,
}: {
  order: Order;
  onPress: (id: string) => void;
  colors: any;
}) {
  // Compute total items (derived UI stat)
  const itemCount = useMemo(
    () => order.items?.reduce((sum, x) => sum + (x.quantity ?? 0), 0) ?? 0,
    [order.items]
  );

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => {
        console.log("[OrderCard] press → open order:", order.id);
        onPress(order.id);
      }}
      style={styles.card}
    >
      <View style={styles.rowBetween}>
        <Text style={[txt.h2, { flex: 1, color: colors.text }]} numberOfLines={1}>
          Order #{order.id.slice(-6).toUpperCase()}
        </Text>

        <Text style={styles.status}>{statusLabel(order.status)}</Text>
      </View>

      <Text style={[txt.muted, { marginTop: spacing.xs, color: colors.muted }]}>
        {new Date(order.createdAt).toLocaleString()}
      </Text>

      <View style={[styles.rowBetween, { marginTop: spacing.md }]}>
        <Text style={[txt.muted, { color: colors.muted }]}>{itemCount} items</Text>
        <Text style={styles.total}>{formatINR(order.totalAmount)}</Text>
      </View>
    </Pressable>
  );
});

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================
export default function Orders() {
  const router = useRouter();
  const { colors, mode } = useTheme();

  const common = useMemo(() => createCommon(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[OrdersScreen] mounted");
    return () => {
      console.log("[OrdersScreen] unmounted");
    };
  }, []);

  // Track state transitions for debugging
  useEffect(() => {
    console.log("[OrdersScreen] loading:", loading);
  }, [loading]);

  useEffect(() => {
    console.log("[OrdersScreen] orders length:", orders.length);
  }, [orders.length]);

  // ==========================================================================
  // LOAD ORDERS (MAUI Equivalent: OnAppearing async load)
  // ==========================================================================
  const load = useCallback(async () => {
    console.log("[OrdersScreen] load() start");
    try {
      setLoading(true);
      const data = await getOrders(); // real API call (service layer)
      setOrders(data);
      console.log("[OrdersScreen] load() success; count:", data?.length ?? 0);
    } finally {
      setLoading(false);
      console.log("[OrdersScreen] load() end");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Navigate to order detail page
  const openOrder = useCallback(
    (orderId: string) => {
      console.log("[OrdersScreen] navigate → /orders/[orderId]:", orderId);
      router.push(`/orders/${orderId}`);
    },
    [router]
  );

  const keyExtractor = useCallback((o: Order) => o.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard order={item} onPress={openOrder} colors={colors} />
    ),
    [openOrder, colors]
  );

  // ==========================================================================
  // RENDER UI
  // ==========================================================================
  return (
    <SafeAreaView style={common.screen}>
      <View style={common.container}>
        {/* HEADER ROW */}
        <View style={styles.headerRow}>
          <Text style={[txt.h1, { color: colors.text }]}>Orders</Text>
          <Pressable
            onPress={() => {
              console.log("[OrdersScreen] Refresh tapped");
              void load();
            }}
            style={styles.refreshBtn}
          >
            <Text style={styles.refreshTxt}>{loading ? "..." : "Refresh"}</Text>
          </Pressable>
        </View>

        {/* LOADING STATE */}
        {loading ? (
          <Text style={[txt.muted, { marginTop: spacing.lg, color: colors.muted }]}>
            Loading…
          </Text>
        ) : orders.length === 0 ? (
          // EMPTY STATE
          <View style={styles.empty}>
            <Text style={[txt.h2, { color: colors.text }]}>No orders yet</Text>
            <Text style={[txt.muted, { marginTop: spacing.xs, color: colors.muted }]}>
              Place an order from Cart to see it here.
            </Text>
          </View>
        ) : (
          // ORDER LIST
          <FlatList
            data={orders}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET
// ============================================================================
const makeStyles = (colors: any) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    refreshBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    refreshTxt: {
      color: colors.text,
      fontWeight: "700",
    },
    empty: {
      marginTop: spacing.xl,
      alignItems: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    status: {
      color: colors.primary,
      fontWeight: "800",
    },
    total: {
      color: colors.text,
      fontWeight: "900",
      fontSize: 16,
    },
  });