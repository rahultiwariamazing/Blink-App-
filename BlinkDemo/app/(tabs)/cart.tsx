// ============================================================================
// FILE: app/(tabs)/cart.tsx
// PATH: app/(tabs)/cart.tsx
//
// PURPOSE OF THIS SCREEN
// ----------------------------------------------------------------------------
// This screen displays the **user’s shopping cart**, allowing them to:
//
//   • View items added to cart
//   • Increase / Decrease item quantity
//   • View subtotal
//   • Proceed to Checkout (creates an order)
//   • Navigate to Home if cart is empty
//   • NEW: Tap a cart row to open View-All (Item Detail) page
//
// This is a **stateful UI screen** tied to Redux cartSlice and uses:
//   - useCartActions()     → clean ViewModel-style cart operations
//   - CommonCounter        → reusable add/remove control (MAUI-style control)
//   - CommonButton         → consistent UI button
//
// The screen reads from:
//   ✔ cartSlice (cart items & totals)
//   ✔ deliverySlice (selected delivery address)
//   ✔ ThemeContext (colors + dark/light mode)
//
// CLEAN ARCHITECTURE LAYERING
// ----------------------------------------------------------------------------
// ✔ UI LAYER (this file)
//    - Renders cart list & summary
//    - Triggers ViewModel actions (add/minus)
//    - Handles Checkout flow + alert dialogs
//    - Uses theme, components, routing
//
// ✔ STATE LAYER (Redux)
//    - cartSlice → holds cart items
//    - deliverySlice → holds selectedAddressId
//
// ✔ SERVICE LAYER (orderService.ts)
//    - createOrder() uses global apiClient with token/refresh handling
//
// ✔ VIEWMODEL-LIKE HOOK (useCartActions.ts)
//    - Abstracts cart logic: addItem, removeItem
//    - Keeps UI clean
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// ContentPage with:
//
//   <CollectionView ItemsSource="{Binding CartItems}">
//     <DataTemplate>
//       <Grid>
//         <Image />
//         <StackLayout>
//           <Label Text="{Binding Name}" />
//           <Label Text="{Binding Price}" />
//           <Stepper />  <-- CommonCounter equivalent
//         </StackLayout>
//       </Grid>
//     </DataTemplate>
//   </CollectionView>
//
// Checkout Button = <Button Command="{Binding CheckoutCommand}" />
//
// THEME SYSTEM
// ----------------------------------------------------------------------------
// Uses:
//     const { colors, mode } = useTheme();
//     const common = useMemo(() => createCommon(colors), [colors]);
//
// Absolutely no direct palette imports.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tag: [CartScreen]
// - Lifecycle: mount/unmount
// - Effects: catalog load start/end
// - Handlers: onPlus/onMinus/onCheckout, navigation decisions
// - State: subtotal/rows/count changes (summarized)
// - Render: limited logs to avoid noise in lists
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

/**
 * Cart Screen (Tabs -> Cart)
 * FILE: app/(tabs)/cart.tsx
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import {
  removeFromCart,
  selectCartCount,
  selectCartItems,
  clearCart,
} from "../../src/store/slices/cartSlice";

import { fetchItems } from "../../src/services/homeService";
import type { Item } from "../../src/models/HomeModels";

import { createOrder } from "../../src/services/orderService";

import { spacing } from "../../src/theme/spacing";
import { createCommon } from "../../src/theme/common";
import { useTheme } from "../../src/theme/ThemeContext";

import CommonCounter from "../../src/components/common/CommonCounter";
import CommonButton from "../../src/components/common/CommonButton";
import { txt } from "../../src/components/common/CommonText";

import { useCartActions } from "../../src/hooks/useCartActions";
import { selectSelectedAddressId } from "../../src/store/slices/deliverySlice";
import { formatINR } from "../../src/utils/currency";

// ============================================================================
// TYPE: Row (UI-friendly row model)
// ============================================================================
type Row = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  lineTotal: number;
};

const FALLBACK_IMAGE = "https://via.placeholder.com/72x72.png?text=Item";

// ============================================================================
// MAIN CART SCREEN
// ============================================================================
export default function CartScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors, mode } = useTheme();

  // ViewModel-like abstraction for cart operations
  const { addItem, removeItem } = useCartActions();

  const common = useMemo(() => createCommon(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors, mode), [colors, mode]);

  // Redux selectors
  const cartItems = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const selectedAddressId = useAppSelector(selectSelectedAddressId);

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Lifecycle logs
  useEffect(() => {
    console.log("[CartScreen] mounted");
    return () => {
      console.log("[CartScreen] unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[CartScreen] cart count changed:", count);
  }, [count]);

  // LOAD: Fetch full product list (for price/name consistency)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        console.log("[CartScreen] fetchItems() start");
        setLoading(true);
        const data = await fetchItems(); // service call
        if (!mounted) return;
        console.log("[CartScreen] fetchItems() success; items:", data?.length ?? 0);
        setAllItems(data);
      } catch (e) {
        console.log("[CartScreen] fetchItems() error:", e);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("[CartScreen] fetchItems() end");
        }
      }
    })();

    return () => {
      mounted = false;
      console.log("[CartScreen] catalog load effect cleanup (mounted = false)");
    };
  }, []);

  // MAP ITEMS BY ID (fast lookup)
  const byId = useMemo(() => {
    const m: Record<string, Item> = {};
    allItems.forEach((i) => (m[i.id] = i));
    return m;
  }, [allItems]);

  // COMPUTE ROWS: Merge Redux cart + fetched product details
  const rows = useMemo((): Row[] => {
    const r = cartItems
      .map((ci): Row | null => {
        const prod = byId[ci.productId];
        const name = prod?.name ?? ci.name ?? "";
        const price = prod?.price ?? ci.price;
        const image =
          (prod as any)?.image ??
          (prod as any)?.imageUrl ??
          ci.imageUrl ??
          FALLBACK_IMAGE;

        if (!name || price == null) return null;

        return {
          id: ci.productId,
          name,
          price,
          image,
          qty: ci.quantity,
          lineTotal: ci.quantity * price,
        };
      })
      .filter((x): x is Row => x !== null);

    console.log("[CartScreen] rows recomputed:", r.length);
    return r;
  }, [cartItems, byId]);

  // SUBTOTAL
  const subtotal = useMemo(
    () => rows.reduce((n, r) => n + r.lineTotal, 0),
    [rows]
  );
  useEffect(() => {
    console.log("[CartScreen] subtotal updated:", subtotal);
  }, [subtotal]);

  // INCREASE / DECREASE
  const onPlus = useCallback(
    (productId: string) => {
      console.log("[CartScreen] onPlus():", productId);
      const prod = byId[productId];
      const ci = cartItems.find((x) => x.productId === productId);
      if (!prod && !ci) {
        console.log("[CartScreen] onPlus() skipped: product not found locally");
        return;
      }

      addItem({
        id: productId,
        name: prod?.name ?? ci?.name ?? "Item",
        price: (prod as any)?.price ?? ci?.price ?? 0,
        image:
          (prod as any)?.image ??
          (prod as any)?.imageUrl ??
          ci?.imageUrl ??
          FALLBACK_IMAGE,
      });
    },
    [addItem, byId, cartItems]
  );

  const onMinus = useCallback(
    (productId: string) => {
      console.log("[CartScreen] onMinus():", productId);
      removeItem(productId);
    },
    [removeItem]
  );

  // NEW: OPEN VIEW-ALL (ITEM DETAIL) FROM CART
  const onOpenItem = useCallback(
    (row: Row) => {
      const prod = byId[row.id];
      const itemPayload = prod
        ? prod
        : {
            id: row.id,
            name: row.name,
            price: row.price,
            image: row.image,
            description: "",
          };

      console.log("[CartScreen] open item → /search/view-all", row.id);
      router.push({
        pathname: "/search/view-all",
        params: {
          id: row.id,
          data: JSON.stringify(itemPayload),
        },
      });
    },
    [byId, router]
  );

  // CHECKOUT → createOrder() → clear cart
  const onCheckout = useCallback(async () => {
    console.log("[CartScreen] onCheckout() start");
    if (placing) {
      console.log("[CartScreen] onCheckout() aborted: placing in progress");
      return;
    }
    if (rows.length === 0) {
      console.log("[CartScreen] onCheckout() aborted: empty cart");
      return;
    }

    if (!selectedAddressId) {
      console.log("[CartScreen] onCheckout() no address → prompt user");
      Alert.alert(
        "Address Required",
        "Please add and select a delivery address before placing the order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Manage Addresses",
            onPress: () => {
              console.log("[CartScreen] navigate → /profile/addresses");
              router.navigate("/profile/addresses");
            },
          },
        ]
      );
      return;
    }

    try {
      setPlacing(true);
      console.log("[CartScreen] creating order with addressId:", selectedAddressId);

      await createOrder({ addressId: selectedAddressId });

      console.log("[CartScreen] order created → clearing cart");
      dispatch(clearCart());

      Alert.alert("Order Placed", "Your order has been placed successfully.", [
        {
          text: "OK",
          onPress: () => {
            console.log("[CartScreen] navigate → /(tabs)/home after order");
            router.navigate("/(tabs)/home");
          },
        },
      ]);
    } catch (e: any) {
      console.log("[CartScreen] order creation failed:", e?.message ?? e);
      Alert.alert(
        "Order Failed",
        e?.message ?? "Something went wrong. Please try again."
      );
    } finally {
      setPlacing(false);
      console.log("[CartScreen] onCheckout() end");
    }
  }, [placing, rows.length, selectedAddressId, router, dispatch]);

  // RENDER LIST ITEM (row is pressable to open detail; counter does not bubble)
  const keyExtractor = useCallback((it: Row) => it.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => (
      <Pressable style={styles.card} onPress={() => onOpenItem(item)}>
        <Image source={{ uri: item.image }} style={styles.img} />

        <View style={styles.cardBody}>
          <Text style={[txt.h2, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          <Text
            style={[
              txt.muted,
              { marginTop: spacing.xs, color: colors.muted },
            ]}
          >
            {formatINR(item.price)}
          </Text>

          <View style={styles.rowBetween}>
            {/* Prevent navigation when tapping the counter */}
            <View pointerEvents="box-none">
              <CommonCounter
                qty={item.qty}
                onMinus={() => onMinus(item.id)}
                onPlus={() => onPlus(item.id)}
              />
            </View>
            <Text style={styles.lineTotal}>{formatINR(item.lineTotal)}</Text>
          </View>
        </View>
      </Pressable>
    ),
    [styles, colors.text, colors.muted, onMinus, onPlus, onOpenItem]
  );

  // UI
  return (
    <SafeAreaView style={common.screen}>
      <View style={common.container}>
        <Text style={[txt.h1, { color: colors.text }]}>
          Your Cart ({count})
        </Text>

        {loading ? (
          <Text
            style={[
              txt.muted,
              { marginTop: spacing.lg, color: colors.muted },
            ]}
          >
            Loading…
          </Text>
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[txt.body, styles.emptyTxt]}>Your cart is empty</Text>
            <CommonButton
              title="Continue Shopping"
              onPress={() => {
                console.log("[CartScreen] Continue Shopping → /(tabs)/home");
                router.navigate("/(tabs)/home");
              }}
            />
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FOOTER SUMMARY */}
        <View style={styles.bottom}>
          <View>
            <Text style={[txt.muted, { color: colors.muted }]}>Subtotal</Text>
            <Text style={[txt.h2, { color: colors.text }]}>
              {formatINR(subtotal)}
            </Text>
          </View>

          <Pressable
            onPress={onCheckout}
            disabled={rows.length === 0 || placing}
            style={({ pressed }) => [
              styles.checkoutBtn,
              pressed && !placing && { opacity: 0.92 },
              (rows.length === 0 || placing) && { opacity: 0.7 },
            ]}
          >
            {placing ? (
              <View style={styles.placingRow}>
                <ActivityIndicator color={colors.textOnPrimary} />
                <Text style={styles.checkoutTxt}>Placing…</Text>
              </View>
            ) : (
              <Text style={styles.checkoutTxt}>Proceed to Checkout</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET
// ============================================================================
const makeStyles = (colors: any, mode: "light" | "dark") =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    img: {
      width: 72,
      height: 72,
      borderRadius: 8,
      backgroundColor: mode === "dark" ? "#0f1624" : "#eee",
    },
    cardBody: {
      flex: 1,
      marginLeft: spacing.md,
    },
    rowBetween: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    lineTotal: {
      fontWeight: "800",
      color: colors.text,
    },

    empty: {
      marginTop: spacing.xl,
      alignItems: "center",
      gap: spacing.md,
    },
    emptyTxt: {
      color: colors.muted,
      fontWeight: "700",
    },

    bottom: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
    },

    checkoutBtn: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 10,
    },
    checkoutTxt: {
      color: colors.textOnPrimary,
      fontWeight: "800",
    },
    placingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
  });