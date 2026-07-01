// ============================================================================
// FILE: src/viewmodels/SignupViewModel.ts
//
// PURPOSE OF THIS VIEWMODEL
// ----------------------------------------------------------------------------
// This hook implements the full MVVM logic for the **Signup (Registration)
// screen**, including:
//
//   ✔ Form state: name, email, mobile, password, confirm password
//   ✔ Validation logic (fields + regex checks)
//   ✔ Busy state (submitting)
//   ✔ Error handling
//   ✔ Register API call
//   ✔ Auto-login behavior if backend returns tokens
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ VIEWMODEL LAYER
//    - Contains all signup-specific business rules
//    - Manages form validation (computed fields via useMemo)
//    - Executes registerApi() and sets session if tokens returned
//    - Exposes { state, actions } for UI binding
//
// ✔ SERVICE LAYER
//    - registerApi() handles backend call + envelope parsing
//    - setSession() persists auth tokens for global apiClient
//
// ✔ UI LAYER
//    - Binds TextInputs to setters
//    - Reads `state.errors`, `state.valid`, `state.submitting`
//    - Calls actions.submit() on button press
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// Similar to a SignupPageViewModel with:
//
//   public string Name { get; set; }
//   public string Email { get; set; }
//   public string Mobile { get; set; }
//   public string Password { get; set; }
//   public string ConfirmPassword { get; set; }
//   public bool IsBusy { get; set; }
//   public string Error { get; set; }
//   public ICommand SubmitCommand { get; }
//
// With validators as computed properties (IsValid).
//
// AUTO-LOGIN SUPPORT
// ----------------------------------------------------------------------------
// If backend returns tokens on register → setSession() is called and the app
// can navigate the user directly into the authenticated experience.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [SignupVM]
// - Logs input changes (sanitized: password/confirm lengths only)
// - Logs validation state transitions (valid flag)
// - Logs submit start/success/failure and auto-login decision
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No logic changes. Only documentation + safe console logs added.
// ============================================================================

import { useState, useMemo, useEffect, useCallback } from "react";
import { registerApi } from "../services/authApi";
import { setSession } from "../services/tokenStorage";

const mobileRe = /^[6-9]\d{9}$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useSignupVM() {
  // ---------------------------------------------------------------------------
  // MVVM STATE (bindings for TextInputs + UI flags)
  // ---------------------------------------------------------------------------
  const [name, setNameState] = useState("");
  const [email, setEmailState] = useState("");
  const [mobile, setMobileState] = useState("");
  const [password, setPasswordState] = useState("");
  const [confirm, setConfirmState] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false); // MVVM: IsBusy
  const [error, setError] = useState<string | null>(null); // MVVM: ErrorMessage

  // Log input changes (sanitized)
  useEffect(() => {
    console.log("[SignupVM] name:", name);
  }, [name]);
  useEffect(() => {
    console.log("[SignupVM] email:", email);
  }, [email]);
  useEffect(() => {
    console.log("[SignupVM] mobile:", mobile);
  }, [mobile]);
  useEffect(() => {
    console.log("[SignupVM] password length:", password.length);
  }, [password]);
  useEffect(() => {
    console.log("[SignupVM] confirm length:", confirm.length);
  }, [confirm]);
  useEffect(() => {
    if (error) console.log("[SignupVM] error:", error);
  }, [error]);
  useEffect(() => {
    console.log("[SignupVM] submitting:", submitting);
  }, [submitting]);

  // Wrapped setters to keep logging consistent and central
  const setName = useCallback((v: string) => {
    console.log("[SignupVM] setName:", v);
    setNameState(v);
  }, []);
  const setEmail = useCallback((v: string) => {
    console.log("[SignupVM] setEmail:", v);
    setEmailState(v);
  }, []);
  const setMobile = useCallback((v: string) => {
    console.log("[SignupVM] setMobile:", v);
    setMobileState(v);
  }, []);
  const setPassword = useCallback((v: string) => {
    console.log("[SignupVM] setPassword length:", v.length);
    setPasswordState(v);
  }, []);
  const setConfirm = useCallback((v: string) => {
    console.log("[SignupVM] setConfirm length:", v.length);
    setConfirmState(v);
  }, []);
  const setShowPwdLogged = useCallback((v: boolean) => {
    console.log("[SignupVM] setShowPwd:", v);
    setShowPwd(v);
  }, []);

  // ---------------------------------------------------------------------------
  // VALIDATION LOGIC (computed like MAUI getters)
  // ---------------------------------------------------------------------------
  const errors = useMemo(() => {
    const trimmedName = name.trim();
    const nameWords = trimmedName ? trimmedName.split(/\s+/).filter(Boolean) : [];
    const trimmedEmail = email.trim();

    const e = {
      name: !trimmedName
        ? "Enter your full name"
        : nameWords.length < 2
          ? "Enter at least 2 words"
          : undefined,

      email: !trimmedEmail
        ? "Enter email"
        : emailRe.test(trimmedEmail)
          ? undefined
          : "Enter valid email",

      mobile: !mobile
        ? "Enter mobile"
        : mobileRe.test(mobile)
          ? undefined
          : "Enter valid 10‑digit mobile",

      password: !password
        ? "Enter password"
        : password.length >= 6
          ? undefined
          : "Min 6 chars",

      confirm: !confirm
        ? "Confirm password"
        : confirm === password
          ? undefined
          : "Passwords do not match",
    };

    return e;
  }, [name, email, mobile, password, confirm]);

  // Is entire form valid?
  const valid =
    !errors.name &&
    !errors.email &&
    !errors.mobile &&
    !errors.password &&
    !errors.confirm &&
    !!name.trim() &&
    !!email.trim() &&
    !!mobile &&
    !!password &&
    !!confirm;

  useEffect(() => {
    console.log("[SignupVM] valid:", valid, "errors:", {
      name: !!errors.name,
      email: !!errors.email,
      mobile: !!errors.mobile,
      password: !!errors.password,
      confirm: !!errors.confirm,
    });
  }, [valid, errors]);

  // ---------------------------------------------------------------------------
  // SUBMIT COMMAND (register + optional auto-login)
  // ---------------------------------------------------------------------------
  const submit = async () => {
    if (!valid || submitting) {
      console.log("[SignupVM] submit aborted (valid/submitting):", { valid, submitting });
      return;
    }

    setSubmitting(true);
    setError(null);
    console.log("[SignupVM] submit start");

    try {
      const res = await registerApi({
        name: name.trim(),
        mobile,
        email: email.trim(),
        password,
      });

      // Auto-login if backend provided tokens
      if ("accessToken" in res) {
        console.log("[SignupVM] auto-login tokens present → setSession()");
        await setSession({
          accessToken: res.accessToken,
          accessTokenExpiresAt: res.accessTokenExpiresAt,
          refreshToken: res.refreshToken,
          refreshTokenExpiresAt: res.refreshTokenExpiresAt,
        });

        console.log("[SignupVM] submit success (autoLoggedIn = true)");
        return { ok: true as const, autoLoggedIn: true as const };
      }

      console.log("[SignupVM] submit success (autoLoggedIn = false)");
      // Otherwise simple account creation
      return { ok: true as const, autoLoggedIn: false as const };
    } catch (e: any) {
      const msg = e?.message ?? "Signup failed";
      console.log("[SignupVM] submit failed:", msg);
      setError(msg);
      return { ok: false as const, autoLoggedIn: false as const };
    } finally {
      setSubmitting(false);
      console.log("[SignupVM] submit end");
    }
  };

  // ---------------------------------------------------------------------------
  // EXPOSED API (for UI binding)
  // ---------------------------------------------------------------------------
  return {
    state: {
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
    },
    actions: {
      setName,
      setEmail,
      setMobile,
      setPassword,
      setConfirm,
      setShowPwd: setShowPwdLogged,
      submit,
      setError, // in case UI wants to reset error explicitly
    },
  };
}