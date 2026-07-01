// ============================================================================
// FILE: app/(tabs)/search.tsx
// PATH: app/(tabs)/search.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This is the SEARCH SCREEN of the BlinkDemo mobile application.
//
// WHAT THIS SCREEN DOES:
//  - Allows user to type a search query.
//  - Automatically searches products from backend (via global apiClient).
//  - Shows ALL returned products directly (no preview, no grouping).
//  - Supports debounce to reduce backend calls.
//  - Lets user add/remove products to cart.
//  - Lets user open the Item Detail screen by tapping a product.
//
// ARCHITECTURE (CLEAN + MVVM PRINCIPLES)
// ----------------------------------------------------------------------------
// 1. **UI Layer (this file)**
//    - Displays search input, list of results, loader, empty view.
//    - Does NOT contain backend logic (except simple search API call).
//    - Handles navigation to item detail.
//
// 2. **Service Layer → homeService.searchProducts()**
//    - Talking to backend via global apiClient (with token refresh, envelope).
//
// 3. **State Layer → Redux Toolkit**
//    - Cart state stored in Redux.
//    - qtyMap built here for O(1) item quantity lookup.
//
// 4. **Business Logic → useCartActions()**
//    - Handles backend "increment quantity", "remove item", busy-map safety.
//
// MAUI EQUIVALENT EXPLANATION
// ----------------------------------------------------------------------------
// In .NET MAUI, this would behave like:
//
//   ContentPage
//     ├── SearchBar (TextChanged event + debounce on ViewModel side)
//     ├── CollectionView (List of matching items)
//     ├── DataTemplate containing image, title, price, button
//     ├── ICommand for Add/Remove actions (bindings)
//     └── Navigation to ItemDetailPage via Shell.Current.GoToAsync()
//
// This React Native page matches that structure, but with React-style hooks.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tag: [SearchScreen]
// - Lifecycle: mount/unmount
// - Effects: debounce search start/end, errors, result count
// - Handlers: onAdd/onRemove/onOpenItem/onClear, query changes
// - UI State: searching flag changes
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Models
import type { Item } from "../../src/models/HomeModels";

// Services (global API)
import { searchProducts } from "../../src/services/homeService";

// Theme System
import { spacing } from "../../src/theme/spacing";
import { createCommon } from "../../src/theme/common";
import { useTheme } from "../../src/theme/ThemeContext";

// Reusable UI Components
import CommonButton from "../../src/components/common/CommonButton";
import CommonCounter from "../../src/components/common/CommonCounter";
import { txt } from "../../src/components/common/CommonText";
import { Loader } from "../../src/components/Loader";

// Redux (Global App State)
import { useAppSelector } from "../../src/store/hooks";
import { selectCartItems } from "../../src/store/slices/cartSlice";

// Cart Actions (Backend + Redux sync)
import { useCartActions } from "../../src/hooks/useCartActions";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

export default function Search() {
  const router = useRouter();
  const { colors, mode } = useTheme();

  // Theme common layout (global rule from Master Prompt)
  const common = useMemo(() => createCommon(colors), [colors]);
  const s = useMemo(() => makeStyles(colors, mode), [colors, mode]);

  const { addItem, removeItem } = useCartActions();

  // UI State
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Item[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lifecycle logs
  useEffect(() => {
    console.log("[SearchScreen] mounted");
    return () => {
      console.log("[SearchScreen] unmounted");
    };
  }, []);

  // Redux cart state
  const cartItems = useAppSelector(selectCartItems);

  // Build O(1) lookup table for quantity (MAUI dictionary analogy)
  const qtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) map.set(item.productId, item.quantity);
    return map;
  }, [cartItems]);

  const qtyOf = useCallback((id: string) => qtyMap.get(id) ?? 0, [qtyMap]);

  // Add / Remove cart handlers
  const onAdd = useCallback(
    (it: { id: string; name: string; price: number; image?: string }) => {
      console.log("[SearchScreen] onAdd()", { id: it.id, name: it.name });
      addItem(it);
    },
    [addItem]
  );

  const onRemove = useCallback(
    (id: string) => {
      console.log("[SearchScreen] onRemove()", { id });
      removeItem(id);
    },
    [removeItem]
  );

  // Track searching flag transitions
  useEffect(() => {
    console.log("[SearchScreen] searching:", searching);
  }, [searching]);

  // ===========================================================================
  // BACKEND SEARCH (DEBOUNCED)
  // MAUI Equivalent:
  //   - ViewModel exposes SearchCommand
  //   - async Task ExecuteSearch(string query)
  //   - Debounce implemented using CancellationToken or Rx
  // ===========================================================================
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const q = query.trim();
    console.log("[SearchScreen] query changed:", q);

    if (q.length < MIN_CHARS) {
      console.log(
        "[SearchScreen] query below MIN_CHARS; clearing results (len =",
        q.length,
        ")"
      );
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    console.log(
      `[SearchScreen] scheduling debounce search in ${DEBOUNCE_MS}ms for query:`,
      q
    );

    debounceRef.current = setTimeout(async () => {
      try {
        console.log("[SearchScreen] searchProducts() start:", q);
        const rows = await searchProducts(q); // global API with token refresh
        console.log(
          "[SearchScreen] searchProducts() success; results:",
          rows?.length ?? 0
        );
        setResults(rows);
      } catch (err) {
        console.log("[SearchScreen] searchProducts() error:", err);
        setResults([]);
      } finally {
        setSearching(false);
        console.log("[SearchScreen] searchProducts() end");
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        console.log("[SearchScreen] cleanup → cancel scheduled debounce");
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [query]);

  // ===========================================================================
  // ON PRODUCT CLICK → OPEN ITEM DETAIL PAGE
  // MAUI Equivalent:
  //   await Shell.Current.GoToAsync("ItemDetailPage", new { Item = selected });
  // ===========================================================================
  const onOpenItem = useCallback(
    (item: Item) => {
      console.log("[SearchScreen] navigate → /search/view-all with item", item.id);
      router.push({
        pathname: "/search/view-all",
        params: {
          id: item.id,
          data: JSON.stringify(item), // Pass entire object
        },
      });
    },
    [router]
  );

  // Clear input
  const onClear = useCallback(() => {
    console.log("[SearchScreen] clear query");
    setQuery("");
    setResults([]);
  }, []);

  const showHint = query.trim().length > 0 && query.trim().length < MIN_CHARS;
  const showLoader = searching;

  // ===========================================================================
  // MAIN UI RENDER
  // ===========================================================================
  return (
    <SafeAreaView style={common.screen}>
      <View style={common.container}>
        <Text style={[txt.h1, { color: colors.text }]}>Search</Text>

        {/* ---------------------------------------------------------------------
           SEARCH BOX (MAUI: SearchBar control)
        --------------------------------------------------------------------- */}
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>

          <TextInput
            value={query}
            onChangeText={(t) => {
              // Log sanitized/trim-length to avoid PII noise
              console.log("[SearchScreen] onChangeText (len):", t.trim().length);
              setQuery(t);
            }}
            placeholder="Search products..."
            placeholderTextColor={colors.muted}
            style={s.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {query.length > 0 && (
            <TouchableOpacity
              onPress={onClear}
              style={s.clearBtn}
            >
              <Text style={s.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hints */}
        {showHint && (
          <Text style={[txt.muted, { marginTop: spacing.sm, color: colors.muted }]}>
            Type at least {MIN_CHARS} characters to search.
          </Text>
        )}

        {!showHint && query.trim().length === 0 && (
          <Text style={[txt.muted, { marginTop: spacing.sm, color: colors.muted }]}>
            Try searching like: “milk”, “bread”, “snacks”
          </Text>
        )}

        {/* ---------------------------------------------------------------------
           RESULTS LIST (MAUI: CollectionView)
        --------------------------------------------------------------------- */}
        <ScrollView
          style={{ marginTop: spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          {/* If no results */}
          {!searching &&
            query.trim().length >= MIN_CHARS &&
            results.length === 0 && (
              <View style={s.empty}>
                <Text style={[txt.h2, { color: colors.text }]}>
                  No results found
                </Text>
                <Text
                  style={[
                    txt.muted,
                    { marginTop: spacing.xs, color: colors.muted },
                  ]}
                >
                  Try a different keyword.
                </Text>
              </View>
            )}

          {/* Result Items */}
          {results.map((it) => {
            const q = qtyOf(it.id);

            return (
              <TouchableOpacity
                key={it.id}
                style={s.itemRow}
                activeOpacity={0.85}
                onPress={() => onOpenItem(it)}
              >
                {/* PRODUCT IMAGE */}
                <Image source={{ uri: it.image }} style={s.itemImg} />

                {/* PRODUCT INFO */}
                <View style={s.itemInfo}>
                  <Text style={[txt.body, s.itemName]} numberOfLines={1}>
                    {it.name}
                  </Text>

                  <Text
                    style={[
                      txt.muted,
                      { marginTop: spacing.xs, color: colors.muted },
                    ]}
                  >
                    ₹{it.price}
                  </Text>
                </View>

                {/* ADD / COUNTER - pointerEvents fixes unwanted navigation */}
                <View style={s.itemAction} pointerEvents="box-none">
                  {q === 0 ? (
                    <CommonButton title="ADD" onPress={() => onAdd(it)} />
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

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>

      {/* Global fullscreen loader */}
      <Loader visible={showLoader} />
    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET (Theme-aware, no direct colors)
// ============================================================================
const makeStyles = (colors: any, mode: "light" | "dark") =>
  StyleSheet.create({
    searchBox: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    searchIcon: {
      marginRight: spacing.sm,
      fontSize: 16,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 0,
    },
    clearBtn: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xs,
    },
    clearText: {
      fontSize: 18,
      color: colors.muted,
      fontWeight: "700",
    },

    empty: {
      marginTop: spacing.xl,
      alignItems: "center",
    },

    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: spacing.md,
    },
    itemImg: {
      width: 54,
      height: 54,
      borderRadius: 10,
      backgroundColor: mode === "dark" ? "#0f1624" : "#eee",
    },
    itemInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    itemName: { fontWeight: "700", color: colors.text },

    itemAction: {
      marginLeft: spacing.md,
      alignItems: "flex-end",
    },
  });