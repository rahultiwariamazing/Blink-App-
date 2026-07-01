// ============================================================================
// FILE: app/(tabs)/home.tsx
// PATH: app/(tabs)/home.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This is the MAIN HOME SCREEN of the BlinkDemo app.
//
// It displays:
//   • User categories (Food, Grocery, Liquor, etc.)
//   • Subcategories (Burgers, Pizzas, etc.)
//   • Product grid (2-column layout)
//   • Add to Cart & Quantity controls
//   • Product tap → open Item Detail Page
//
// ARCHITECTURE (MVVM + Clean Architecture)
// ----------------------------------------------------------------------------
// ✔ All backend calls + business logic come from HomeViewModel (useHomeVM())
// ✔ This screen ONLY renders UI (View layer)
// ✔ Cart uses Redux Toolkit + useCartActions()
// ✔ Theming uses ThemeContext + createCommon()
// ✔ Navigation uses Expo Router (router.push)
//
// MAUI EQUIVALENT EXPLANATION
// ----------------------------------------------------------------------------
// This screen behaves like:
//
//   ContentPage
//     ├── Horizontal ScrollView → Categories (BindableLayout)
//     ├── Horizontal ScrollView → Subcategories (BindableLayout)
//     ├── CollectionView (GridItemsLayout 2 columns) → Products
//     └── Navigation to ItemDetailPage with NavigationParameter
//
// The quantity counter is analogous to ICommand bindings in MAUI.
//
// IMPORTANT FOR THIS FILE
// ----------------------------------------------------------------------------
// ✔ UI is NOT changed
// ✔ Only navigation + comments + logs added
// ✔ ADD button press does NOT trigger navigation (using pointerEvents="box-none")
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tag: [HomeScreen]
// - Lifecycle: mount/unmount
// - VM state changes: catId, subId, initialLoading, listLoading
// - Actions/Handlers: category tap, subcategory tap, add/remove cart,
//   navigate to detail
// - Render noise kept minimal (no per-item logs during grid render)
// ============================================================================

import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

// MVVM ViewModel
import { useHomeVM } from "../../src/viewmodels/HomeViewModel";

// Redux selectors
import { useAppSelector } from "../../src/store/hooks";
import { selectCartItems } from "../../src/store/slices/cartSlice";

// Theme system
import { spacing } from "../../src/theme/spacing";
import { createCommon } from "../../src/theme/common";
import { useTheme } from "../../src/theme/ThemeContext";

// UI components
import CommonButton from "../../src/components/common/CommonButton";
import CommonCounter from "../../src/components/common/CommonCounter";
import { txt } from "../../src/components/common/CommonText";

// Cart logic (clean business layer)
import { useCartActions } from "../../src/hooks/useCartActions";

export default function Home() {
  const router = useRouter();
  const { colors, mode } = useTheme();

  const common = useMemo(() => createCommon(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors, mode), [colors, mode]);

  const { addItem, removeItem } = useCartActions();

  // VM state + actions
  const { state, actions } = useHomeVM();
  const {
    initialLoading,
    listLoading,
    categories,
    filteredSubcats,
    filteredItems,
    catId,
    subId,
  } = state;

  const { setCatId, setSubId } = actions;

  const cartItems = useAppSelector(selectCartItems);

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[HomeScreen] mounted");
    return () => {
      console.log("[HomeScreen] unmounted");
    };
  }, []);

  // VM STATE CHANGE LOGS
  useEffect(() => {
    console.log("[HomeScreen] catId changed:", catId);
  }, [catId]);

  useEffect(() => {
    console.log("[HomeScreen] subId changed:", subId);
  }, [subId]);

  useEffect(() => {
    console.log("[HomeScreen] initialLoading:", initialLoading);
  }, [initialLoading]);

  useEffect(() => {
    console.log("[HomeScreen] listLoading:", listLoading);
  }, [listLoading]);

  useEffect(() => {
    console.log("[HomeScreen] filteredItems count:", filteredItems.length);
  }, [filteredItems.length]);

  // O(1) quantity map (MAUI analogy: Dictionary<string,int>)
  const qtyMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of cartItems) m.set(x.productId, x.quantity);
    return m;
  }, [cartItems]);

  const qtyOf = useCallback((id: string) => qtyMap.get(id) ?? 0, [qtyMap]);

  const onAdd = useCallback(
    (it: { id: string; name: string; price: number; image?: string }) => {
      console.log("[HomeScreen] onAdd()", { id: it.id, name: it.name });
      addItem(it);
    },
    [addItem]
  );

  const onRemove = useCallback(
    (id: string) => {
      console.log("[HomeScreen] onRemove()", { id });
      removeItem(id);
    },
    [removeItem]
  );

  // Initial loader (MAUI: ActivityIndicator inside Grid)
  if (initialLoading) {
    console.log("[HomeScreen] render initial loader");
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={common.screen}>
      <ScrollView style={common.container} showsVerticalScrollIndicator={false}>
        {/* ---------------------------------------------------------------------
           TOP BANNER AREA (MAUI: Border + VerticalStackLayout)
        --------------------------------------------------------------------- */}
        <View style={styles.banner}>
          <Text style={[txt.h1, { color: colors.text }]}>Flat 40% OFF</Text>
          <Text style={[txt.body, { marginTop: spacing.xs, color: colors.muted }]}>
            First Order
          </Text>
        </View>

        {/* ---------------------------------------------------------------------
           CATEGORY SCROLLER (MAUI: Horizontal ScrollView + BindableLayout)
        --------------------------------------------------------------------- */}
        <Text style={[txt.h2, { marginTop: spacing.lg, color: colors.text }]}>
          Choose Category
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.sm }}
        >
          {categories.map((c) => {
            const active = c.id === catId;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  console.log("[HomeScreen] category tap:", c.id, c.name);
                  setCatId(c.id);
                }}
                style={[styles.catCard, active && styles.catActive]}
              >
                <Text
                  style={[txt.body, styles.catText, active && styles.catTextActive]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ---------------------------------------------------------------------
           SUBCATEGORY SCROLLER
        --------------------------------------------------------------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md }}
        >
          {filteredSubcats.map((sc) => {
            const active = sc.id === subId;
            return (
              <TouchableOpacity
                key={sc.id}
                onPress={() => {
                  console.log("[HomeScreen] subcategory tap:", sc.id, sc.name);
                  setSubId(sc.id);
                }}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text
                  style={[txt.body, styles.pillText, active && styles.pillTextActive]}
                >
                  {sc.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* LIST LOADING (after category/subcat change) */}
        {listLoading ? (
          <View style={styles.listLoadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[txt.muted, { marginLeft: spacing.sm, color: colors.muted }]}>
              Loading items...
            </Text>
          </View>
        ) : null}

        {/* ---------------------------------------------------------------------
           PRODUCT GRID (2-column Grid)
           MAUI Equivalent: CollectionView with GridItemsLayout
        --------------------------------------------------------------------- */}
        <View style={styles.grid}>
          {filteredItems.map((it) => {
            const q = qtyOf(it.id);

            return (
              <TouchableOpacity
                key={it.id}
                style={styles.card}
                activeOpacity={0.85}
                // NAVIGATION TO DETAILS PAGE
                onPress={() =>
                  {
                    console.log("[HomeScreen] navigate → /search/view-all with item", it.id);
                    router.push({
                      pathname: "/search/view-all",
                      params: {
                        id: it.id,
                        data: JSON.stringify(it), // send full product JSON
                      },
                    });
                  }
                }
              >
                {/* PRODUCT IMAGE */}
                <Image source={{ uri: it.image }} style={styles.img} />

                {/* PRODUCT NAME */}
                <Text style={[txt.body, styles.title]} numberOfLines={1}>
                  {it.name}
                </Text>

                {/* PRODUCT PRICE */}
                <Text
                  style={[
                    txt.muted,
                    { color: colors.muted, marginTop: spacing.xs },
                  ]}
                >
                  ₹{it.price}
                </Text>

                {/* ------------------------------------------------------------------
                   ADD / COUNTER SECTION
                   MAUI Equivalent: Command Buttons inside DataTemplate
                   IMPORTANT:
                   - pointerEvents="box-none" ensures button press does NOT bubble
                     to TouchableOpacity → prevents unwanted navigation
                ------------------------------------------------------------------ */}
                <View style={{ marginTop: spacing.sm }} pointerEvents="box-none">
                  {q === 0 ? (
                    <CommonButton
                      title="ADD"
                      onPress={() => onAdd(it)}
                    />
                  ) : (
                    <CommonCounter
                      qty={q}
                      onMinus={() => onRemove(it.id)}
                      onPlus={() => onAdd(it)}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES — NO CHANGES TO YOUR ORIGINAL STYLE NAMES
// ============================================================================
const makeStyles = (colors: any, mode: "light" | "dark") =>
  StyleSheet.create({
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },

    banner: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      borderRadius: 12,
      marginVertical: spacing.lg,
    },

    catCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginRight: spacing.sm,
    },
    catActive: {
      borderColor: colors.primary,
      backgroundColor: mode === "dark" ? colors.card : "#e8f8ee",
    },
    catText: { color: colors.text, fontWeight: "600" },
    catTextActive: { color: colors.primary },

    pill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillText: { color: colors.text, fontWeight: "600" },
    pillTextActive: { color: colors.textOnPrimary },

    listLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: spacing.lg,
      paddingBottom: spacing.xl,
    },

    card: {
      width: "48%",
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },

    img: {
      width: "100%",
      height: 110,
      borderRadius: 10,
      backgroundColor: mode === "dark" ? "#0f1624" : "#eee",
    },

    title: {
      marginTop: spacing.sm,
      fontWeight: "700",
      color: colors.text,
    },
  });