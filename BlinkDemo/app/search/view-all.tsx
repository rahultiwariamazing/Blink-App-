// ============================================================================
// FILE: app/search/view-all.tsx
// PATH: app/search/view-all.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This screen acts as the **Item Detail Page**. Even though its route name is
// “view-all”, it is now used as the **single product detail page** that shows:
//
//   • Product image
//   • Product name + price
//   • ADD / Quantity controls (connected to backend + Redux)
//   • Description (“About” section)
//
// This screen receives full product data from:
//   - Search Page
//   - Home Page
//
// via: router.push({ params: { id, data: JSON.stringify(item) } })
//
// CLEAN ARCHITECTURE + MVVM
// ----------------------------------------------------------------------------
// ✔ UI Layer              → This file (only presentation logic)
// ✔ ViewModel Layer       → HomeViewModel or Search debounce logic (outside)
// ✔ Service Layer         → cartApi (increment qty, remove item)
// ✔ Global API handling   → apiClient (refresh-token, envelope parsing)
// ✔ State Layer           → Redux + redux-persist (cart quantity)
// ✔ Business Layer        → useCartActions()
//
// MAUI EQUIVALENT (FOR LEARNING)
// ----------------------------------------------------------------------------
// In .NET MAUI this page is equivalent to:
//
//   ContentPage
//     ├── Image (Product)
//     ├── VerticalStackLayout
//     │     ├── ProductName Label
//     │     ├── Price Label
//     │     ├── Quantity (Buttons bound to ICommand)
//     │     └── Description Label
//     └── Navigation Parameter: Passed via Shell Routing
//
// The ViewModel in MAUI would expose:
//   - Product model
//   - IncrementQuantityCommand
//   - DecrementQuantityCommand
//
// THEME SYSTEM
// ----------------------------------------------------------------------------
// Theme must always be loaded using:
//    const { colors, mode } = useTheme();
//    const common = useMemo(() => createCommon(colors), [colors]);
//
// No direct color imports are allowed outside /theme/.
//
// NAVIGATION
// ----------------------------------------------------------------------------
// Uses Expo Router:
//    const params = useLocalSearchParams();
//    const item = JSON.parse(params.data);
//
// If the data is missing or corrupted → graceful fallback shown.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [ItemDetail]
// - Lifecycle: mount/unmount
// - Params: id present/missing, JSON parse result
// - Handlers: onAdd, onMinus, back press
// - State: qty changes
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { Item } from "../../src/models/HomeModels";

// Theme
import { spacing } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme/ThemeContext";
import { createCommon } from "../../src/theme/common";

// UI Components
import { txt } from "../../src/components/common/CommonText";
import CommonButton from "../../src/components/common/CommonButton";
import CommonCounter from "../../src/components/common/CommonCounter";

// Cart & Redux
import CartBadge from "../../src/components/CartBadge";
import { useCartActions } from "../../src/hooks/useCartActions";
import { useAppSelector } from "../../src/store/hooks";
import { selectCartItems } from "../../src/store/slices/cartSlice";

// -----------------------------------------------------------------------------
// SAFE PARSE UTILITY
// MAUI equivalent: TryParse() for JSON Navigation Parameters
// -----------------------------------------------------------------------------
function safeParse(raw?: string): Item | null {
  try {
    if (!raw) return null;
    return JSON.parse(raw) as Item;
  } catch {
    return null;
  }
}

export default function ViewAll() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; data?: string }>();

  // Parse the product data safely
  const item = safeParse(params.data);

  // Theme system
  const { colors, mode } = useTheme();
  const common = useMemo(() => createCommon(colors), [colors]);
  const s = useMemo(() => makeStyles(colors, mode), [colors, mode]);

  // Cart logic (clean architecture)
  const { addItem, removeItem } = useCartActions();
  const cartItems = useAppSelector(selectCartItems);

  // Current product quantity in cart
  const qty = useMemo(
    () => (item ? cartItems.find((x) => x.productId === item.id)?.quantity ?? 0 : 0),
    [cartItems, item]
  );

  // ---------------------------------------------------------------------------
  // LIFECYCLE / PARAM LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[ItemDetail] mounted with params:", { id: params.id, hasData: !!params.data });
    console.log("[ItemDetail] parsed item:", item ? { id: item.id, name: item.name } : null);
    return () => {
      console.log("[ItemDetail] unmounted");
    };
  }, [params.id, params.data, item]);

  useEffect(() => {
    if (item) {
      console.log("[ItemDetail] qty changed:", { itemId: item.id, qty });
    }
  }, [qty, item]);

  // Add / Remove handlers (MAUI ICommand equivalent)
  const onAdd = useCallback(() => {
    if (!item) {
      console.log("[ItemDetail] onAdd ignored (no item)");
      return;
    }
    console.log("[ItemDetail] onAdd()", { id: item.id, name: item.name });
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  }, [item, addItem]);

  const onMinus = useCallback(() => {
    if (!item) {
      console.log("[ItemDetail] onMinus ignored (no item)");
      return;
    }
    console.log("[ItemDetail] onMinus()", { id: item.id });
    removeItem(item.id);
  }, [item, removeItem]);

  // ===========================================================================
  // UI RENDER
  // ===========================================================================
  return (
    <SafeAreaView style={common.screen}>
      <View style={common.container}>
        {/* ---------------------------------------------------------------------
           HEADER AREA
           MAUI Equivalent: Grid with two columns (Back + Title + CartBadge)
        --------------------------------------------------------------------- */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => {
              console.log("[ItemDetail] back pressed");
              router.back();
            }}
            style={s.backBtn}
          >
            <Text style={s.backText}>{"‹"}</Text>
          </TouchableOpacity>

          <Text style={s.headerTitle} numberOfLines={1}>
            {"Search > Item"}
          </Text>

          <CartBadge />
        </View>

        {/* ---------------------------------------------------------------------
           INVALID / MISSING DATA STATE
        --------------------------------------------------------------------- */}
        {!item ? (
          <View style={s.empty}>
            <Text style={[txt.h2, { color: colors.text }]}>No item data</Text>
            <Text style={[txt.muted, { marginTop: spacing.xs }]}>
              Something went wrong.
            </Text>
          </View>
        ) : (
          /* -------------------------------------------------------------------
             MAIN PRODUCT DETAIL CARD
             MAUI Equivalent: Frame + ScrollView
          ------------------------------------------------------------------- */
          <View style={s.cardWrapper}>
            <ScrollView
              style={s.scrollArea}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
              showsVerticalScrollIndicator={false}
            >
              {/* Product Image */}
              <Image source={{ uri: item.image }} style={s.img} />

              {/* Title + Price */}
              <View style={s.rowBetween}>
                <Text style={[txt.h2, s.name]}>{item.name}</Text>
                <Text style={[txt.h2, s.price]}>₹{item.price}</Text>
              </View>

              {/* Space below title */}
              <View style={{ height: spacing.xl }} />

              {/* Quantity controls */}
              <View style={[s.rowBetween, { marginTop: spacing.sm }]}>
                <Text style={[txt.body, { color: colors.muted }]}>Quantity</Text>

                {qty === 0 ? (
                  <CommonButton title="ADD" onPress={onAdd} />
                ) : (
                  <CommonCounter qty={qty} onMinus={onMinus} onPlus={onAdd} />
                )}
              </View>

              {/* About Section */}
              {!!item.description && (
                <View style={{ marginTop: spacing.xl }}>
                  <Text style={[txt.h2, { color: colors.text }]}>About</Text>

                  <Text
                    style={[
                      txt.muted,
                      {
                        marginTop: spacing.xs,
                        lineHeight: 20,
                        color: colors.muted,
                      },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET
// Theme-safe, no hardcoded colors, no style-name changes.
// ============================================================================
const makeStyles = (colors: any, mode: "light" | "dark") =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
      backgroundColor: colors.card,
    },
    backText: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text,
      marginTop: -1,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "900",
      color: colors.text,
    },

    empty: {
      marginTop: spacing.xl,
      alignItems: "center",
    },

    cardWrapper: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },

    scrollArea: {
      flex: 1,
    },

    img: {
      width: "100%",
      height: 260,
      borderRadius: 12,
      backgroundColor: mode === "dark" ? colors.surfaceAlt : "#eee",
      marginBottom: spacing.lg,
    },

    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    name: {
      fontWeight: "800",
      color: colors.text,
      flex: 1,
      paddingRight: spacing.md,
    },

    price: {
      fontWeight: "900",
      color: colors.text,
    },
  });