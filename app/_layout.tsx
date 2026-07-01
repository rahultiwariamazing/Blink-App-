import React, { useEffect } from "react";
import {
  Stack,
  useSegments,
  useRouter,
  useRootNavigationState,
} from "expo-router";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { ThemeProvider } from "../src/theme/ThemeContext";
import { ToastProvider } from "../src/components/Toast/ToastProvider";
import { store, persistor } from "../src/store/store";
import { useAppSelector } from "../src/store/hooks";

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const ready = useRootNavigationState()?.key != null;

  const token = useAppSelector((s) => s.auth.token);
  const loggedIn = Boolean(token);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const inAuth = segments[0] === "(auth)";

    if (!loggedIn && !inAuth) {
      router.replace("/(auth)/login");
      return;
    }

    if (loggedIn && inAuth) {
      router.replace("/(tabs)/home");
    }
  }, [ready, loggedIn, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <ToastProvider>
            {/* Redirects between auth and app routes based on token state. */}
            <AuthGate />

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="orders/[orderId]" />
              <Stack.Screen name="profile/addresses" />
              <Stack.Screen
                name="profile/address-form"
                options={{ presentation: "modal" }}
              />
            </Stack>
          </ToastProvider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
}