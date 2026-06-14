// ============================================================================
// FILE: src/services/bootstrapApi.ts   (you can keep your original filename)
// PATH: src/services/bootstrapApi.ts
//
// PURPOSE OF THIS SERVICE
// ----------------------------------------------------------------------------
// Provides initial bootstrap data for the authenticated user (e.g., cart snapshot).
// Uses the centralized apiClient (apiJson) with envelope-aware parsing and
// built-in token/refresh handling.
//
// WHAT IT RETURNS
// ----------------------------------------------------------------------------
// The endpoint /api/me/bootstrap returns an envelope with Data that (at least)
// includes a cart snapshot list. This file exposes the FE type `BootstrapCart`.
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ SERVICE LAYER (pure network + mapping layer)
//    - No UI logic
//    - No Redux access
//    - Calls REST endpoints via apiClient
//    - Returns FE-friendly data; caller decides how to use it
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// An HttpClient-backed DataService:
//
//   public class BootstrapService {
//       Task<BootstrapData> GetAsync();
//   }
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [bootstrapApi]
// - Logs request start/end and list sizes
// - Does not log PII or entire payloads
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No logic changes; original behavior preserved
// - Only comments + safe logs added
// ============================================================================

import { apiJson } from "./apiClient";

export type BootstrapCart = {
  ProductId: string;
  ProductName: string;
  ImageUrl?: string;
  Price: number;
  Quantity: number;
};

/**
 * Fetches initial bootstrap data for the current user session.
 * The exact shape depends on backend; commonly includes cart items, profile, etc.
 */
export async function fetchBootstrap() {
  console.log("[bootstrapApi] fetchBootstrap start: GET /api/me/bootstrap");
  const res = await apiJson<any>("/api/me/bootstrap", { method: "GET" });

  // Avoid logging entire payloads; summarize instead.
  const hasData = !!res?.Data;
  const cartCount =
    Array.isArray(res?.Data?.Cart) ? res.Data.Cart.length : undefined;

  console.log("[bootstrapApi] fetchBootstrap success:", {
    hasData,
    cartCount,
  });

  return res?.Data;
}