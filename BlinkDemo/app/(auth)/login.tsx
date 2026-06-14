// ============================================================================
// FILE: app/(auth)/login.tsx
// PATH: app/(auth)/login.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This screen handles **user sign-in** using mobile + password.
//
// INPUTS:
//   • Mobile Number (10 digits, starts 6–9)
//   • Password (min 6 chars)
//
// VALIDATION:
//   • Inline validation for mobile/password formatting.
//   • Backend error (wrong credentials, etc.) shown via Toast.
//
// CLEAN ARCHITECTURE LAYERS (Project Blueprint)
// ----------------------------------------------------------------------------
// ✔ UI LAYER (This File)
//    - Renders inputs and validation messages
//    - Binds events to local handlers
//    - Triggers Redux async thunk (loginThunk)
//    - No direct API calls in UI
//
// ✔ VIEWMODEL / LOGIC LAYER
//    - For login we use Redux thunk (authSlice.loginThunk)
//    - Index gate handles navigation after token is set
//
// ✔ SERVICE LAYER
//    - Global apiClient + token refresh + envelope parsing (used inside thunk)
//
// ✔ STATE LAYER (Redux + Persist)
//    - authSlice manages token, user, loading, and error
//    - UI reads `isLoading` and `error` from store
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
//   ContentPage
//     ├── Entry: Mobile      ↔ View State (mobile), Validates pattern
//     ├── Entry: Password    ↔ View State (password)
//     ├── Button: Log in     ↔ Command → loginThunk()
//     └── Label/Toast errors ↔ auth.error + Toast
//
// NAVIGATION
// ----------------------------------------------------------------------------
// - No local redirect after login; **index gate** performs navigation when
//   tokens are available in Redux/session.
// - "Create account" navigates to (auth)/signup.
//
// THEME SYSTEM (Master Prompt Rule)
// ----------------------------------------------------------------------------
// Must use:
//     const { colors } = useTheme();
//     const common = useMemo(() => createCommon(colors), [colors]);
// No direct import from theme/colors.ts.
//
// LOGGING STRATEGY
// ----------------------------------------------------------------------------
// - Tag used for all logs: [LoginScreen]
// - Lifecycle: mount/unmount
// - Effects: clearing backend error on input, showing toast on error
// - Handlers: handleLogin(), toggle password visibility, navigate to signup,
//   submit via keyboard "go".
// - Kept minimal to avoid noisy re-render logs.
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments and console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import { clearAuthError, loginThunk } from "../../src/store/slices/authSlice";

import { useTheme } from "../../src/theme/ThemeContext";
import { createCommon } from "../../src/theme/common";
import { useToast } from "../../src/components/Toast/ToastProvider";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  // Theme system (per architecture rule)
  const { colors } = useTheme();
  const common = useMemo(() => createCommon(colors), [colors]);

  // Redux state (UI reads from store; no direct API here)
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const error = useAppSelector((s) => s.auth.error);

  // Local UI state (inputs + UI-only toggles)
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[LoginScreen] mounted");
    return () => {
      console.log("[LoginScreen] unmounted");
    };
  }, []);

  // Clear backend error only when user types (prevents stale error sticking)
  useEffect(() => {
    console.log(
      "[LoginScreen] clearAuthError effect triggered (mobile/password changed)"
    );
    dispatch(clearAuthError());
  }, [mobile, password, dispatch]);

  // Show toast on wrong creds or any backend error
  useEffect(() => {
    if (error) {
      console.log("[LoginScreen] auth error observed → showing toast:", error);
      showToast(error, { type: "error", durationMs: 2500 });
    }
  }, [error, showToast]);

  // ---------------------------------------------------------------------------
  // INLINE VALIDATION (UI ONLY)
  // ---------------------------------------------------------------------------
  const mobileErr =
    mobile.length > 0 && !/^[6-9]\d{9}$/.test(mobile)
      ? "Enter a valid 10-digit mobile"
      : undefined;

  const pwdErr =
    password.length > 0 && password.length < 6
      ? "Password must be at least 6 chars"
      : undefined;

  const isFormValid = /^[6-9]\d{9}$/.test(mobile) && password.length >= 6;

  useEffect(() => {
    console.log("[LoginScreen] isFormValid changed:", isFormValid);
  }, [isFormValid]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  const handleLogin = async () => {
    console.log("[LoginScreen] handleLogin() tapped");

    if (!isFormValid) {
      console.log("[LoginScreen] handleLogin() aborted: form invalid");
      return;
    }
    if (isLoading) {
      console.log("[LoginScreen] handleLogin() aborted: already loading");
      return;
    }

    console.log("[LoginScreen] dispatching loginThunk");
    await dispatch(loginThunk({ mobile, password }));
    console.log("[LoginScreen] loginThunk dispatched (index gate handles nav)");
    // ✅ No local redirect here. Index gate handles navigation after token set.
  };

  // ---------------------------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      // MAUI: Equivalent to configuring Page behavior for keyboard overlay
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={common.container}>
        <View style={common.card}>
          {/* -------------------------------------------------------------------
             TITLE
             MAUI: <Label FontAttributes="Bold" />
          ------------------------------------------------------------------- */}
          <Text style={common.title}>Sign in</Text>

          {/* -------------------------------------------------------------------
             MOBILE
             MAUI: <Entry Keyboard="Telephone" MaxLength="10" />
          ------------------------------------------------------------------- */}
          <Text style={common.label}>Mobile number</Text>
          <TextInput
            value={mobile}
            onChangeText={(t) => {
              const digitsOnly = t.replace(/\D/g, "");
              setMobile(digitsOnly);
              // Logging input changes for traceability (sanitized)
              console.log("[LoginScreen] mobile changed:", digitsOnly);
            }}
            placeholder="10-digit mobile"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            maxLength={10}
            style={[common.input, mobileErr && common.inputError]}
          />
          {!!mobileErr && <Text style={common.errorText}>{mobileErr}</Text>}

          {/* -------------------------------------------------------------------
             PASSWORD
             MAUI: <Entry IsPassword="True" />
          ------------------------------------------------------------------- */}
          <Text style={common.label}>Password</Text>
          <View style={[common.inputRow, pwdErr && common.inputError]}>
            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                console.log("[LoginScreen] password changed (length):", t.length);
              }}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPwd}
              style={common.inputFlex}
              returnKeyType="go"
              onSubmitEditing={() => {
                console.log("[LoginScreen] onSubmitEditing → handleLogin()");
                handleLogin();
              }}
            />
            <TouchableOpacity
              onPress={() => {
                console.log(
                  "[LoginScreen] toggle password visibility (was):",
                  showPwd
                );
                setShowPwd((s) => !s);
              }}
              style={common.pwdToggle}
            >
              <Text style={common.linkText}>{showPwd ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
          {!!pwdErr && <Text style={common.errorText}>{pwdErr}</Text>}

          {/* Backend-level error (login failure) is shown via Toast; keeping label for layout parity */}
          {!!error && <Text style={common.errorTop}>{error}</Text>}

          {/* -------------------------------------------------------------------
             LOGIN BUTTON
             MAUI: <Button Command="{Binding LoginCommand}" />
          ------------------------------------------------------------------- */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
            style={[
              common.secondaryButton,
              (!isFormValid || isLoading) && common.secondaryButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={common.secondaryButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* LINK → NAVIGATE TO SIGNUP */}
          <TouchableOpacity
            onPress={() => {
              console.log("[LoginScreen] navigate → '/(auth)/signup'");
              router.push("/(auth)/signup");
            }}
            style={common.centerLink}
          >
            <Text style={common.linkText}>New here? Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}