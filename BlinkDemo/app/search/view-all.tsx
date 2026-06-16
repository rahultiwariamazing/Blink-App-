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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Loader } from "../../src/components/Loader";

// Cart & Redux
import CartBadge from "../../src/components/CartBadge";
import { useCartActions } from "../../src/hooks/useCartActions";
import { useAppSelector } from "../../src/store/hooks";
import { selectCartItems } from "../../src/store/slices/cartSlice";
import {
  canUseAiInsight,
  getProductInsight,
  type ProductInsight,
} from "../../src/services/aiInsightService";

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
  const item = useMemo(() => safeParse(params.data), [params.data]);

  // Theme system
  const { colors, mode } = useTheme();
  const common = useMemo(() => createCommon(colors), [colors]);
  const s = useMemo(() => makeStyles(colors, mode), [colors, mode]);

  // Cart logic (clean architecture)
  const { addItem, removeItem } = useCartActions();
  const cartItems = useAppSelector(selectCartItems);
  const [insight, setInsight] = useState<ProductInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const lastAutoLoadedItemIdRef = useRef<string | null>(null);

  // Current product quantity in cart
  const qty = useMemo(
    () => (item ? cartItems.find((x) => x.productId === item.id)?.quantity ?? 0 : 0),
    [cartItems, item]
  );

  // ---------------------------------------------------------------------------
  // LIFECYCLE / PARAM LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[ItemDetail] mounted");
    return () => {
      console.log("[ItemDetail] unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[ItemDetail] params:", { id: params.id, hasData: !!params.data });
    console.log("[ItemDetail] parsed item:", item ? { id: item.id, name: item.name } : null);
  }, [params.id, params.data, item?.id, item?.name]);

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

  const loadInsight = useCallback(async () => {
    if (!item) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const data = await getProductInsight(item);
      setInsight(data);
    } catch (e: any) {
      setAiError(e?.message ?? "Could not generate insight right now.");
      setInsight(null);
    } finally {
      setAiLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    if (!canUseAiInsight()) {
      setAiLoading(false);
      setInsight(null);
      setAiError("AI key missing. Add EXPO_PUBLIC_GROQ_API_KEY in env.");
      return;
    }

    if (lastAutoLoadedItemIdRef.current === item.id) {
      return;
    }

    lastAutoLoadedItemIdRef.current = item.id;
    loadInsight();
  }, [item?.id, loadInsight, item]);

  const verdictMeta = useMemo(() => {
    if (!insight) {
      return { label: "Pending", color: colors.muted, bg: colors.card };
    }
    if (insight.verdict === "must_buy") {
      return { label: "Must Buy", color: "#0f5132", bg: "#d1fae5" };
    }
    if (insight.verdict === "skip") {
      return { label: "Skip", color: "#7f1d1d", bg: "#fee2e2" };
    }
    return { label: "Consider", color: "#854d0e", bg: "#fef3c7" };
  }, [insight, colors.muted, colors.card]);

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

              <View style={s.priceStrip}>
                <Text style={s.priceStripLabel}>Smart Buy Signal</Text>
                <View style={[s.verdictPill, { backgroundColor: verdictMeta.bg }]}>
                  <Text style={[s.verdictText, { color: verdictMeta.color }]}>
                    {verdictMeta.label}
                  </Text>
                </View>
              </View>

              {/* Quantity controls */}
              <View style={[s.rowBetween, { marginTop: spacing.sm }]}>
                <Text style={[txt.body, { color: colors.muted }]}>Quantity</Text>

                {qty === 0 ? (
                  <CommonButton title="ADD" onPress={onAdd} />
                ) : (
                  <CommonCounter qty={qty} onMinus={onMinus} onPlus={onAdd} />
                )}
              </View>

              <View style={s.aiCard}>
                <View style={s.aiHeaderRow}>
                  <Text style={s.aiTitle}>AI Product Insight</Text>
                  <TouchableOpacity
                    style={s.aiRefreshBtn}
                    onPress={loadInsight}
                    disabled={aiLoading || !item}
                  >
                    <Text style={s.aiRefreshText}>{aiLoading ? "Loading" : "Refresh"}</Text>
                  </TouchableOpacity>
                </View>

                {aiLoading ? (
                  <View style={s.aiLoadingWrap}>
                    <Loader />
                    <Text style={s.aiMuted}>Analyzing product quality and health fit...</Text>
                  </View>
                ) : aiError ? (
                  <View style={s.aiErrorWrap}>
                    <Text style={s.aiErrorText}>{aiError}</Text>
                  </View>
                ) : insight ? (
                  <>
                    <Text style={s.aiSummary}>{insight.summary}</Text>

                    <Text style={s.aiSectionTitle}>Health View</Text>
                    <Text style={s.aiBody}>{insight.health}</Text>

                    <Text style={s.aiSectionTitle}>Pros</Text>
                    {insight.pros.length === 0 ? (
                      <Text style={s.aiMuted}>No strong pros available.</Text>
                    ) : (
                      insight.pros.map((p, idx) => (
                        <Text key={`pro-${idx}`} style={s.aiBullet}>{`+ ${p}`}</Text>
                      ))
                    )}

                    <Text style={s.aiSectionTitle}>Cons</Text>
                    {insight.cons.length === 0 ? (
                      <Text style={s.aiMuted}>No strong cons available.</Text>
                    ) : (
                      insight.cons.map((c, idx) => (
                        <Text key={`con-${idx}`} style={s.aiBullet}>{`- ${c}`}</Text>
                      ))
                    )}

                    <View style={s.aiFooterRow}>
                      <Text style={s.aiConfidence}>{`Confidence: ${Math.round(insight.confidence)}%`}</Text>
                    </View>
                    <Text style={s.aiDisclaimer}>{insight.disclaimer}</Text>
                  </>
                ) : null}
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
      backgroundColor: mode === "dark" ? "#0f172a" : "#eee",
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
    priceStrip: {
      marginBottom: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    priceStripLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    verdictPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 999,
    },
    verdictText: {
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    aiCard: {
      marginTop: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 14,
      padding: spacing.md,
      gap: spacing.xs,
    },
    aiHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    aiTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
    },
    aiRefreshBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    aiRefreshText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700",
    },
    aiLoadingWrap: {
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      alignItems: "flex-start",
    },
    aiErrorWrap: {
      backgroundColor: mode === "dark" ? "#3f1d1d" : "#fee2e2",
      borderRadius: 10,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    aiErrorText: {
      color: mode === "dark" ? "#fecaca" : "#991b1b",
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 18,
    },
    aiSummary: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    aiSectionTitle: {
      marginTop: spacing.sm,
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    aiBody: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    aiBullet: {
      marginTop: spacing.xs,
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
    },
    aiMuted: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    aiFooterRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    aiConfidence: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700",
    },
    aiDisclaimer: {
      marginTop: spacing.xs,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
    },
  });