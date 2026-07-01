// ============================================================================
// FILE: app/(auth)/signup.tsx
// PATH: app/(auth)/signup.tsx
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// This screen is responsible for **user account creation**.
// It collects necessary inputs:
//
//   • Full Name
//   • Email
//   • Mobile Number
//   • Password
//   • Confirm Password
//
// VALIDATIONS are handled in the SignupViewModel.
// ERROR MESSAGES are also computed and exposed by the ViewModel.
// SUBMIT LOGIC runs through an async command that communicates with backend.
//
// CLEAN ARCHITECTURE LAYERS
// ----------------------------------------------------------------------------
// ✔ UI LAYER (This File)
//    - Renders input fields + errors
//    - Binds value / events to ViewModel
//    - Triggers submit command
//    - Handles navigation on success
//
// ✔ VIEWMODEL LAYER (useSignupVM())
//    - Holds form values
//    - Holds errors
//    - Runs validation rules
//    - Runs submit() command (Async)
//    - Updates state immutably
//
// ✔ SERVICE LAYER (Inside ViewModel)
//    - Talks to backend via global apiClient
//    - Follows envelope parsing rules (Success, StatusCode, Data, etc.)
//
// ✔ STATE LAYER
//    - Signup does NOT store to Redux directly
//    - Only Login updates Redux (tokens), so Signup is isolated
//
// MAUI EQUIVALENT FOR LEARNING
// ----------------------------------------------------------------------------
// This React Native page directly corresponds to a MAUI:
//
//   ContentPage
//     ├── Entry: FullName        ↔ vm.Name
//     ├── Entry: Email           ↔ vm.Email
//     ├── Entry: Mobile          ↔ vm.Mobile
//     ├── Entry: Password        ↔ vm.Password
//     ├── Entry: ConfirmPassword ↔ vm.Confirm
//     ├── Button                 ↔ vm.SubmitCommand
//     └── Label errors           ↔ vm.Errors["FieldName"]
//
// Navigation in MAUI:
//     Shell.Current.GoToAsync("..")   (Back to Login)
//
// BUSINESS RULES
// ----------------------------------------------------------------------------
// - User cannot submit until ViewModel determines form validity.
// - Email + mobile must be unique (backend enforced).
// - Password must match confirm.
// - Password must meet minimum length.
// - Mobile must be exactly 10 digits.
//
// THEME SYSTEM (Master Prompt rule)
// ----------------------------------------------------------------------------
// Must use:
//     const { colors } = useTheme();
//     const common = useMemo(() => createCommon(colors), [colors]);
//
// No direct import from theme/colors.ts.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// - Tag: [SignupScreen]
// - Lifecycle: mount/unmount
// - Field changes: name, email, mobile (sanitized), password/confirm (length only)
// - Actions: toggle show password, submit(), back to login
// - State: valid/submitting/error/errors change logs
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No design/logic changes. Only comments + console logs added.
// - Safe to paste and run. Production-safe.
// ============================================================================

import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

// MVVM: ViewModel BindingContext
import { useSignupVM } from "../../src/viewmodels/SignupViewModel";

// Theme engine
import { useTheme } from "../../src/theme/ThemeContext";
import { createCommon } from "../../src/theme/common";

export default function SignupScreen() {
  const router = useRouter();

  // Theme system (required per architecture guideline)
  const { colors } = useTheme();
  const common = useMemo(() => createCommon(colors), [colors]);

  // ViewModel bindings (bindable state + commands)
  const { state, actions } = useSignupVM();

  const {
    name,
    email,
    mobile,
    password,
    confirm,
    showPwd,
    submitting,
    error,
    errors,
    valid,
  } = state;

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[SignupScreen] mounted");
    return () => {
      console.log("[SignupScreen] unmounted");
    };
  }, []);

  // Observe key VM state changes
  useEffect(() => {
    console.log("[SignupScreen] valid changed:", valid);
  }, [valid]);

  useEffect(() => {
    console.log("[SignupScreen] submitting changed:", submitting);
  }, [submitting]);

  useEffect(() => {
    if (error) console.log("[SignupScreen] backend error:", error);
  }, [error]);

  useEffect(() => {
    // Logging field-level errors for debugging (object reference printed)
    if (errors) console.log("[SignupScreen] field errors changed:", errors);
  }, [errors]);

  // Navigation back to Login
  const goLogin = () => {
    console.log("[SignupScreen] navigate back to Login (router.back())");
    router.back();
  };

  // Execute signup command
  const onSubmit = async () => {
    console.log("[SignupScreen] onSubmit() called → actions.submit()");
    const res = await actions.submit();
    console.log("[SignupScreen] submit() resolved:", res);
    if (res?.ok) {
      console.log("[SignupScreen] signup success → navigating back to Login");
      goLogin();
    } else {
      console.log("[SignupScreen] signup failed (see error above if provided)");
    }
  };

  // ===========================================================================
  // MAIN UI
  // ===========================================================================
  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={64}
    >
      <View style={common.container}>
        <View style={common.card}>
          {/* -------------------------------------------------------------------
             TITLE
             MAUI: <Label FontAttributes="Bold" />
          ------------------------------------------------------------------- */}
          <Text style={common.title}>Create Account</Text>

          {/* -------------------------------------------------------------------
             FULL NAME
             MAUI: <Entry Text="{Binding Name}" />
          ------------------------------------------------------------------- */}
          <Text style={common.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              console.log("[SignupScreen] name changed:", t);
              actions.setName(t);
            }}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            style={[common.input, errors.name && common.inputError]}
            returnKeyType="next"
          />
          {!!errors.name && <Text style={common.errorText}>{errors.name}</Text>}

          {/* -------------------------------------------------------------------
             EMAIL
             MAUI: <Entry Keyboard="Email" />
          ------------------------------------------------------------------- */}
          <Text style={common.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={(t) => {
              console.log("[SignupScreen] email changed:", t);
              actions.setEmail(t);
            }}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[common.input, errors.email && common.inputError]}
            returnKeyType="next"
          />
          {!!errors.email && <Text style={common.errorText}>{errors.email}</Text>}

          {/* -------------------------------------------------------------------
             MOBILE
             MAUI: <Entry Keyboard="Telephone" MaxLength="10" />
          ------------------------------------------------------------------- */}
          <Text style={common.label}>Mobile</Text>
          <TextInput
            value={mobile}
            onChangeText={(t) => {
              const digits = t.replace(/\D/g, "");
              console.log("[SignupScreen] mobile changed:", digits);
              actions.setMobile(digits);
            }}
            placeholder="10-digit mobile"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            maxLength={10}
            style={[common.input, errors.mobile && common.inputError]}
            returnKeyType="next"
          />
          {!!errors.mobile && <Text style={common.errorText}>{errors.mobile}</Text>}

          {/* -------------------------------------------------------------------
             PASSWORD
             MAUI: <Entry IsPassword="True" />
          ------------------------------------------------------------------- */}
          <Text style={common.label}>Password</Text>
          <View style={[common.inputRow, errors.password && common.inputError]}>
            <TextInput
              value={password}
              onChangeText={(t) => {
                console.log("[SignupScreen] password changed (length):", t.length);
                actions.setPassword(t);
              }}
              placeholder="Min 6 chars"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPwd}
              style={common.inputFlex}
              returnKeyType="next"
            />
            <TouchableOpacity
              onPress={() => {
                console.log(
                  "[SignupScreen] toggle showPwd (was):",
                  showPwd,
                  "→ (now):",
                  !showPwd
                );
                actions.setShowPwd(!showPwd);
              }}
              style={common.pwdToggle}
            >
              <Text style={common.linkText}>{showPwd ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
          {!!errors.password && (
            <Text style={common.errorText}>{errors.password}</Text>
          )}

          {/* -------------------------------------------------------------------
             CONFIRM PASSWORD
             MAUI: Additional validation rule: Matches Password
          ------------------------------------------------------------------- */}
          <Text style={common.label}>Confirm password</Text>
          <TextInput
            value={confirm}
            onChangeText={(t) => {
              console.log(
                "[SignupScreen] confirm changed (length):",
                t.length
              );
              actions.setConfirm(t);
            }}
            placeholder="Re-enter password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPwd}
            style={[common.input, errors.confirm && common.inputError]}
            returnKeyType="go"
            onSubmitEditing={() => {
              console.log(
                "[SignupScreen] onSubmitEditing on Confirm → onSubmit()"
              );
              onSubmit();
            }}
          />
          {!!errors.confirm && (
            <Text style={common.errorText}>{errors.confirm}</Text>
          )}

          {/* Backend-level error (signup failure) */}
          {!!error && <Text style={common.errorTop}>{error}</Text>}

          {/* -------------------------------------------------------------------
             SIGNUP BUTTON
             MAUI: <Button Command="{Binding SubmitCommand}" />
          ------------------------------------------------------------------- */}
          <TouchableOpacity
            disabled={!valid || submitting}
            onPress={onSubmit}
            style={[
              common.primaryButton,
              (!valid || submitting) && common.primaryButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={common.primaryButtonText}>Sign up</Text>
            )}
          </TouchableOpacity>

          {/* LINK → BACK TO LOGIN */}
          <TouchableOpacity
            onPress={() => {
              console.log("[SignupScreen] back to Login link tapped");
              goLogin();
            }}
            style={common.centerLink}
          >
            <Text style={common.linkText}>Have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}