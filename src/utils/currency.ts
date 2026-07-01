// ============================================================================
// FILE: src/utils/currency.ts
//
// PURPOSE OF THIS UTILITY
// ----------------------------------------------------------------------------
// Provides a single reusable helper to format Indian Rupee values consistently
// across the entire application.
//
// Responsibilities:
//   ✔ Convert numeric values → INR currency string
//   ✔ Use "en-IN" locale so formatting matches Indian style
//   ✔ Remove fractional digits (Blinkit-style integer prices)
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ UTILITY LAYER
//     - Stateless pure function
//     - Reusable from services, ViewModels, and UI components
//     - Prevents repeated Intl.NumberFormat boilerplate
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// Similar to:
//
//   string.Format(new CultureInfo("en-IN"), "{0:C0}", amount);
//
// Or a helper:
//
//   public string FormatINR(decimal n) =>
//       n.ToString("C0", CultureInfo.GetCultureInfo("en-IN"));
//
// ============================================================================

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);