// ============================================================================
// FILE: src/utils/globalToast.ts
//
// PURPOSE OF THIS FILE
// ----------------------------------------------------------------------------
// Provides a lightweight global bridge for triggering toast messages from
// ANYWHERE in the application—even outside React components.
//
// Why this exists:
//   ✔ ViewModels (hooks) may need toast — without passing props
//   ✔ API client (apiClient.ts) may need to show session expiration toasts
//   ✔ Service layer may need to show backend error messages
//
// This is intentionally minimal: ToastProvider registers itself here, and every
// caller simply uses showGlobalToast("message").
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ CROSS-LAYER UTILITY
//     - Avoids prop drilling
//     - Allows non-React code (services, apiClient) to show UI feedback
//
// ✔ UI LAYER (ToastProvider)
//     - Provides actual rendering + animation
//     - Calls setGlobalToast() to attach showToast(msg, opts)
//
// ✔ SERVICE / API CLIENT LAYER
//     - Calls showGlobalToast() when needed
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// Similar to using:
//
//   App.Current.MainPage.DisplayToastAsync("Hello");
//
// Or a global messaging center:
//
//   MessagingCenter.Send(this, "Toast", "Text");
//
// ============================================================================

let _toast: ((msg: string, opts?: any) => void) | null = null;

/**
 * Registers the toast handler.
 * Called once by <ToastProvider /> on mount.
 */
export function setGlobalToast(fn: (msg: string, opts?: any) => void) {
  _toast = fn;
}

/**
 * Global toast trigger.
 * Can be used inside services, apiClient, or ViewModels.
 */
export function showGlobalToast(msg: string, opts?: any) {
  if (_toast) _toast(msg, opts);
}