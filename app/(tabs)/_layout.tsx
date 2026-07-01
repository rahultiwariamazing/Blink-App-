// ============================================================================
// FILE: app/(tabs)/_layout.tsx
// PATH: app/(tabs)/_layout.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// Configures the **main Bottom Tab Navigation** for the authenticated area.
// It also renders a dynamic header showing the current delivery address,
// which can be tapped to navigate to address management.
//
// CLEAN ARCHITECTURE ROLE (Project Blueprint)
// ----------------------------------------------------------------------------
// ✔ UI Routing Layer (this file)
//    - Declares the authenticated (tabs) navigation container
//    - No business logic, no direct API from screens
//    - Purely structural; header content composes address label via services
//
// ✔ Theme Integration
//    - Reads theme from ThemeContext and applies to header/tab bar
//
// ✔ State Layer (Redux)
//    - Reads delivery selection from deliverySlice
//    - May dispatch setSelectedAddressId based on initial/default address
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// In MAUI Shell, this maps to a TabBar with multiple ShellContent items:
//
//   <Shell>
//     <TabBar>
//       <ShellContent Route="Home"    ContentTemplate="{DataTemplate HomePage}" />
//       <ShellContent Route="Search"  ContentTemplate="{DataTemplate SearchPage}" />
//       <ShellContent Route="Cart"    ContentTemplate="{DataTemplate CartPage}" />
//       <ShellContent Route="Orders"  ContentTemplate="{DataTemplate OrdersPage}" />
//       <ShellContent Route="Profile" ContentTemplate="{DataTemplate ProfilePage}" />
//     </TabBar>
//   </Shell>
//
// The header location area ≈ a custom NavBar title view in MAUI.
//
// NAVIGATION & DATA RULES
// ----------------------------------------------------------------------------
// - HeaderLocation:
//     • Shows selected address label (or prompts to add/select)
//     • Taps navigate to addresses list or open add-address form
// - Address loading logic:
//     • If `selectedAddressId` exists → fetch that address
//     • Else → fetch list, prefer default; otherwise first item
//     • Keep deliverySlice.selectedAddressId in sync
//
// LOGGING STRATEGY
// ----------------------------------------------------------------------------
// - Tag: [TabsLayout], [HeaderLocation]
// - Lifecycle: mount/unmount
// - Effects: selected id changes, address load begin/end, decisions
// - Handlers: header press, navigation decisions
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design or logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import CartBadge from "../../src/components/CartBadge";
import { spacing } from "../../src/theme/spacing";
import { txt } from "../../src/components/common/CommonText";
import { useTheme } from "../../src/theme/ThemeContext";

import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import {
  setSelectedAddressId,
  selectSelectedAddressId,
} from "../../src/store/slices/deliverySlice";

import type { UserAddress } from "../../src/models/address";

import { fetchAddresses, getAddressById } from "../../src/services/addressApi";

// -----------------------------------------------------------------------------
// HEADER LOCATION COMPONENT
// -----------------------------------------------------------------------------
// Displays the current "Delivery To" address. On press, routes to address
// management. Keeps internal debounced/memoized title state to avoid
// unnecessary re-renders while still reacting to store/service results.
function HeaderLocation({ textColor }: { textColor: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s: any) => s.auth.user);
  const userId = user?.id ?? "u1"; // Safe fallback for demo/mock mode

  const selectedAddressId = useAppSelector(selectSelectedAddressId);

  const [title, _setTitle] = useState<string>("Select Address ▼");
  const [loadingTitle, _setLoadingTitle] = useState<boolean>(false);
  const [hasAnyAddress, _setHasAnyAddress] = useState<boolean>(true);

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[HeaderLocation] mounted");
    return () => {
      console.log("[HeaderLocation] unmounted");
    };
  }, []);

  // Refs guard redundant setState to reduce extra renders for same values
  const titleRef = useRef(title);
  const setTitle = (v: string) => {
    if (titleRef.current !== v) {
      console.log("[HeaderLocation] setTitle:", v);
      titleRef.current = v;
      _setTitle(v);
    } else {
      console.log("[HeaderLocation] setTitle skipped (no change)");
    }
  };

  const loadingRef = useRef(loadingTitle);
  const setLoadingTitle = (v: boolean) => {
    if (loadingRef.current !== v) {
      console.log("[HeaderLocation] setLoadingTitle:", v);
      loadingRef.current = v;
      _setLoadingTitle(v);
    }
  };

  const anyAddrRef = useRef(hasAnyAddress);
  const setHasAnyAddress = (v: boolean) => {
    if (anyAddrRef.current !== v) {
      console.log("[HeaderLocation] setHasAnyAddress:", v);
      anyAddrRef.current = v;
      _setHasAnyAddress(v);
    }
  };

  // Track previous selected id (for debugging transitions)
  const prevSelectedIdRef = useRef<string | null>(selectedAddressId ?? null);
  useEffect(() => {
    console.log(
      "[HeaderLocation] selectedAddressId changed:",
      prevSelectedIdRef.current,
      "→",
      selectedAddressId ?? null
    );
    prevSelectedIdRef.current = selectedAddressId ?? null;
  }, [selectedAddressId]);

  // Load header title based on selected id or defaults
  useEffect(() => {
    let alive = true;

    const loadHeaderAddress = async () => {
      console.log("[HeaderLocation] loadHeaderAddress() start");
      setLoadingTitle(true);
      try {
        // If there is a selected address id, attempt to load it directly
        if (selectedAddressId) {
          console.log(
            "[HeaderLocation] fetching address by id:",
            selectedAddressId
          );
          const res = await getAddressById(selectedAddressId);
          if (alive && res.ok && res.data) {
            const a = res.data as UserAddress;
            const label = `${a.label} • ${a.city} ${a.pincode} ▼`;
            setTitle(label);
            setHasAnyAddress(true);
            console.log("[HeaderLocation] using explicitly selected address");
            return;
          }
          console.log(
            "[HeaderLocation] getAddressById failed or no data; will fallback to list"
          );
        }

        // Fallback: fetch list and choose default or first
        console.log("[HeaderLocation] fetching address list for user:", userId);
        const listRes = await fetchAddresses(userId);
        if (!alive) return;

        if (!listRes.ok) {
          console.log(
            "[HeaderLocation] fetchAddresses not ok → reset to 'Select Address'"
          );
          setTitle("Select Address ▼");
          setHasAnyAddress(true);
          return;
        }

        const rows = listRes.data ?? [];
        console.log("[HeaderLocation] address rows:", rows.length);

        if (rows.length === 0) {
          console.log("[HeaderLocation] no addresses found");
          setTitle("Add delivery address ▼");
          setHasAnyAddress(false);

          if (selectedAddressId) {
            console.log(
              "[HeaderLocation] clearing stale selectedAddressId in store"
            );
            dispatch(setSelectedAddressId(null));
          }
          return;
        }

        const def = rows.find((x) => x.isDefault) ?? rows[0];
        const label = `${def.label} • ${def.city} ${def.pincode} ▼`;
        setTitle(label);
        setHasAnyAddress(true);

        if (!selectedAddressId || selectedAddressId !== def.id) {
          console.log(
            "[HeaderLocation] syncing store selectedAddressId to:",
            def.id
          );
          dispatch(setSelectedAddressId(def.id));
        } else {
          console.log("[HeaderLocation] store id already matches default row");
        }
      } catch (e) {
        console.log("[HeaderLocation] loadHeaderAddress error:", e);
        // Keep prior title; UX continues gracefully
      } finally {
        if (alive) {
          setLoadingTitle(false);
          console.log("[HeaderLocation] loadHeaderAddress() end");
        }
      }
    };

    void loadHeaderAddress();
    return () => {
      alive = false;
      console.log("[HeaderLocation] effect cleanup (alive = false)");
    };
  }, [dispatch, selectedAddressId, userId]);

  // Tap header to manage/select address
  const onPressHeader = () => {
    if (hasAnyAddress) {
      console.log("[HeaderLocation] press → navigate to /profile/addresses");
      router.push("/profile/addresses");
    } else {
      console.log(
        "[HeaderLocation] press → navigate to /profile/address-form?mode=add"
      );
      router.push({
        pathname: "/profile/address-form",
        params: { mode: "add" },
      });
    }
  };

  return (
    <Pressable onPress={onPressHeader} style={s.headerTitle}>
      <Text style={txt.muted}>DELIVERY TO</Text>
      <Text style={[s.headerCountry, { color: textColor }]}>
        {loadingTitle ? "Loading..." : title}
      </Text>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// TABS LAYOUT (ROOT OF AUTHENTICATED EXPERIENCE)
// -----------------------------------------------------------------------------
export default function TabsLayout() {
  const { colors } = useTheme();

  // Lifecycle logs for layout
  useEffect(() => {
    console.log("[TabsLayout] mounted");
    return () => {
      console.log("[TabsLayout] unmounted");
    };
  }, []);

  const tabBarStyle = useMemo(
    () => [
      s.tabBar,
      { backgroundColor: colors.bg, borderTopColor: colors.border },
    ],
    [colors.bg, colors.border]
  );

  useEffect(() => {
    console.log("[TabsLayout] theme colors changed for tab bar:", {
      bg: colors.bg,
      border: colors.border,
      primary: colors.primary,
      text: colors.text,
      muted: colors.muted,
    });
  }, [colors.bg, colors.border, colors.primary, colors.text, colors.muted]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitle: () => {
          console.log("[TabsLayout] headerTitle render");
          return <HeaderLocation textColor={colors.text} />;
        },
        headerRight: () => {
          console.log("[TabsLayout] headerRight render (CartBadge)");
          return <CartBadge />;
        },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => {
            console.log("[TabsLayout] tab icon render: home");
            return <Ionicons name="home-outline" size={22} color={color} />;
          },
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => {
            console.log("[TabsLayout] tab icon render: search");
            return <Ionicons name="search-outline" size={22} color={color} />;
          },
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          headerShown: false, // Cart provides its own header UX
          tabBarIcon: ({ color }) => {
            console.log("[TabsLayout] tab icon render: cart");
            return <Ionicons name="cart-outline" size={22} color={color} />;
          },
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => {
            console.log("[TabsLayout] tab icon render: orders");
            return <Ionicons name="receipt-outline" size={22} color={color} />;
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => {
            console.log("[TabsLayout] tab icon render: profile");
            return <Ionicons name="person-outline" size={22} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}

// -----------------------------------------------------------------------------
// STYLES
// -----------------------------------------------------------------------------
const s = StyleSheet.create({
  headerTitle: {
    paddingVertical: 2,
    paddingHorizontal: spacing.lg,
  },
  headerCountry: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabBar: {
    height: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
