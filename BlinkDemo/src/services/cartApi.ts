// ============================================================================
// FILE: src/services/cartApi.ts
//
// PURPOSE OF THIS SERVICE
// ----------------------------------------------------------------------------
// This service provides ALL backend network operations for cart management:
//
//   ✔ getCart()           → fetch all items in user's cart
//   ✔ upsertCartItem()    → add/update item quantity (+1 or -1 or set)
//   ✔ deleteCartItem()    → remove a specific product from cart
//   ✔ clearCart()         → remove all products
//
// This service **only talks to the backend** using the global API client, and
// returns FE-ready plain objects.
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ SERVICE LAYER (Cart Domain)
//    - Pure network I/O
//    - No Redux logic and no UI logic
//    - No ViewModel state updates
//    - Returns clean, typed data
//
// ✔ VIEWMODEL / HOOK LAYER (useCartActions)
//    - Calls these functions
//    - Handles optimistic updates
//    - Shows toast messages
//
// ✔ UI LAYER
//    - Only consumes ViewModel outputs
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// Matches a CartService.cs + HttpClient wrapper:
//
//   public Task<List<CartItem>> GetCartAsync();
//   public Task UpsertCartItemAsync(id, qty);
//   public Task DeleteCartItemAsync(id);
//   public Task ClearCartAsync();
//
// Envelope logic here ≈ middleware/handler in MAUI.
//
// WHY WE USE apiJson<T>()
// ----------------------------------------------------------------------------
// - Injects tokens automatically
// - Handles 401 with refresh logic
// - Throws ApiError when envelope Success=false
//
// The helper wrappers apiGet/apiPost/apiDelete standardize envelope extraction.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [cartApi]
// - Never log secrets or entire payloads
// - Log endpoint, method, and key identifiers (productId, sizes)
// - Keep logs concise to avoid noisy console
// ============================================================================

import { apiJson } from "./apiClient";

type ApiEnvelope<T> = {
  Success: boolean;
  StatusCode: number;
  Message: string;
  ErrorCode: string | null;
  TraceId: string;
  Data: T | null;
};

// ============================================================================
// INTERNAL HELPERS (GET / POST / DELETE)
// ----------------------------------------------------------------------------
// These helpers unwrap backend envelope responses so public functions only
// return `T` without forcing callers to deal with envelope boilerplate.
// ============================================================================

async function apiGet<T>(path: string): Promise<T> {
  console.log("[cartApi] GET:", path);
  const json = await apiJson<any>(path, { method: "GET" });

  if (json && typeof json === "object" && "Success" in json && "Data" in json) {
    const env = json as ApiEnvelope<T>;
    if (env.Success === true) {
      // Log summary instead of entire payload
      const data = (env.Data ?? ([] as any)) as T;
      if (Array.isArray(data)) {
        console.log("[cartApi] GET success; items:", data.length);
      } else {
        console.log("[cartApi] GET success");
      }
      return data;
    }
    console.log("[cartApi] GET envelope failure:", env.Message);
    throw new Error(env.Message || "Request failed");
  }

  console.log("[cartApi] GET success (non-envelope)");
  return json as T;
}

async function apiPost<T>(path: string, body: object): Promise<T> {
  console.log("[cartApi] POST:", path);
  const json = await apiJson<any>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (json && typeof json === "object" && "Success" in json && "Data" in json) {
    const env = json as ApiEnvelope<T>;
    if (env.Success === true) {
      console.log("[cartApi] POST success");
      return (env.Data ?? null) as T;
    }
    console.log("[cartApi] POST envelope failure:", env.Message);
    throw new Error(env.Message || "Request failed");
  }

  console.log("[cartApi] POST success (non-envelope)");
  return json as T;
}

async function apiDelete<T>(path: string): Promise<T> {
  console.log("[cartApi] DELETE:", path);
  const json = await apiJson<any>(path, { method: "DELETE" });

  if (json && typeof json === "object" && "Success" in json && "Data" in json) {
    const env = json as ApiEnvelope<T>;
    if (env.Success === true) {
      console.log("[cartApi] DELETE success");
      return (env.Data ?? null) as T;
    }
    console.log("[cartApi] DELETE envelope failure:", env.Message);
    throw new Error(env.Message || "Request failed");
  }

  console.log("[cartApi] DELETE success (non-envelope)");
  return json as T;
}

// ============================================================================
// PUBLIC CART METHODS
// ----------------------------------------------------------------------------
// These are consumed by useCartActions() to sync frontend cart → backend.
// All methods return FE-ready results and use proper envelope mapping.
// ============================================================================

/**
 * getCart()
 * ---------------------------------------------------------------------------
 * Fetches all cart items associated with the current authenticated user.
 *
 * Returns:
 *   [{ productId, quantity }, ...]
 *
 * MAUI equivalent:
 *   await CartService.GetCartAsync();
 */
export async function getCart(): Promise<
  { productId: string; quantity: number }[]
> {
  return await apiGet(`/api/cart`);
}

/**
 * upsertCartItem()
 * ---------------------------------------------------------------------------
 * Adds or updates quantity for a cart item:
 *   +1 (increment) or -1 (decrement) or direct setQty() from ViewModel.
 *
 * MAUI equivalent:
 *   await CartService.UpsertItemAsync(id, qty);
 */
export async function upsertCartItem(
  productId: string,
  quantity: number
): Promise<void> {
  console.log("[cartApi] upsertCartItem:", { productId, quantity });
  await apiPost(`/api/cart/upsert`, { productId, quantity });
}

/**
 * deleteCartItem()
 * ---------------------------------------------------------------------------
 * Removes a specific product from cart entirely.
 *
 * MAUI equivalent:
 *   await CartService.DeleteItemAsync(id);
 */
export async function deleteCartItem(productId: string): Promise<void> {
  console.log("[cartApi] deleteCartItem:", { productId });
  await apiDelete(`/api/cart/${encodeURIComponent(productId)}`);
}

/**
 * clearCart()
 * ---------------------------------------------------------------------------
 * Deletes every item from the user's cart.
 *
 * MAUI equivalent:
 *   await CartService.ClearAsync();
 */
export async function clearCart(): Promise<void> {
  console.log("[cartApi] clearCart()");
  await apiPost(`/api/cart/clear`, {});
}