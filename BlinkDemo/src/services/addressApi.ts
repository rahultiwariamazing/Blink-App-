// ============================================================================
// FILE: src/services/addressApi.ts
//
// PURPOSE OF THIS SERVICE
// ----------------------------------------------------------------------------
// This service handles all **address-related API operations**, including:
//
//   ✔ Fetching all addresses
//   ✔ Fetching a single address by ID
//   ✔ Creating / Updating an address (upsert)
//   ✔ Deleting an address
//   ✔ Marking an address as default
//
// It uses the **global apiClient (apiJson)** which automatically handles:
//   • Token attachment
//   • Token refresh on 401
//   • Envelope parsing
//   • Error transformation
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ SERVICE LAYER (pure network + mapping layer)
//    - No UI logic
//    - No Redux access
//    - Calls REST endpoints
//    - Converts PascalCase → camelCase models for the FE
//
// ✔ VIEWMODEL INTERACTION
//    - AddressViewModel calls these functions
//    - UI receives fully typed FE models (UserAddress)
//
// MAUI EQUIVALENT
// ----------------------------------------------------------------------------
// DataService injected into a ViewModel:
//
//   public class AddressService {
//       Task<List<UserAddress>> FetchAddressesAsync();
//       Task SaveAddressAsync(UserAddress model);
//       Task DeleteAddressAsync(string id);
//   }
//
// Model mapping (mapAddress) ≈ MAUI DTO → DomainModel mapping.
//
// API RESPONSE STANDARDIZATION
// ----------------------------------------------------------------------------
// Returns friendly union types:
//
//   { ok: true, data: T }
//   { ok: false, message: string }
//
// UI/ViewModel never deals with thrown fetch errors.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [addressApi]
// - Logs request start/end and endpoint/method
// - Logs list sizes, IDs, default flags
// - Logs mapping counts/errors
// - Never logs PII beyond IDs/flags/minimal fields
// ============================================================================

import { apiJson } from "./apiClient";
import { UserAddress } from "../models/address";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; message: string };

// ============================================================================
// MODEL MAPPING (PascalCase → camelCase)
// ----------------------------------------------------------------------------
// Backend returns PascalCase fields, but FE models must be camelCase.
// Similar to MAUI AutoMapper / DTO → Model conversion.
// ============================================================================
function mapAddress(a: any): UserAddress {
  // Minimal mapping log for diagnostics
  // (Avoid logging full address lines to prevent noisy console)
  // eslint-disable-next-line no-console
  console.log("[addressApi] mapAddress:", {
    Id: a?.Id,
    IsDefault: a?.IsDefault,
    HasCoords: !!a?.Lat && !!a?.Lng,
  });

  return {
    id: a.Id,
    userId: a.UserId ?? "",
    label: a.Label ?? "",
    addressLine: a.AddressLine ?? "",
    pincode: a.Pincode ?? "",
    city: a.City ?? "",
    lat: a.Lat ?? null,
    lng: a.Lng ?? null,
    isDefault: a.IsDefault ?? false,
    createdAt: a.CreatedAt ?? "",
    updatedAt: a.UpdatedAt ?? "",
  };
}

// ============================================================================
// GET ADDRESS BY ID
// ----------------------------------------------------------------------------
// Retrieves all addresses (backend limitation) and finds the one with given ID.
// ============================================================================
export async function getAddressById(
  id: string
): Promise<ApiResponse<UserAddress | null>> {
  console.log("[addressApi] getAddressById start:", id);

  try {
    const res = await apiJson<{ Data: any[] | null }>("/api/addresses", {
      method: "GET",
    });

    const listRaw = res?.Data ?? [];
    console.log("[addressApi] getAddressById fetched rows:", listRaw.length);

    const list = listRaw.map(mapAddress);
    const found = list.find((x) => x.id === id) ?? null;

    console.log("[addressApi] getAddressById found:", !!found);
    return { ok: true, data: found };
  } catch (e: any) {
    const msg = e?.message ?? "Failed to load address";
    console.log("[addressApi] getAddressById error:", msg);
    return { ok: false, message: msg };
  }
}

// ============================================================================
// FETCH ALL ADDRESSES
// ----------------------------------------------------------------------------
// UserId is ignored by backend; endpoint returns all for authenticated user.
// Sorted so that default address appears first.
// ============================================================================
export async function fetchAddresses(
  _userId: string
): Promise<ApiResponse<UserAddress[]>> {
  console.log("[addressApi] fetchAddresses start");

  try {
    const res = await apiJson<{ Data: any[] | null }>("/api/addresses", {
      method: "GET",
    });

    const listRaw = res?.Data ?? [];
    console.log("[addressApi] fetchAddresses fetched rows:", listRaw.length);

    const list = listRaw.map(mapAddress);
    const sorted = list
      .slice()
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

    console.log("[addressApi] fetchAddresses sorted; defaultFirst:", sorted[0]?.isDefault ?? false);
    return { ok: true, data: sorted };
  } catch (e: any) {
    const msg = e?.message ?? "Failed to load addresses";
    console.log("[addressApi] fetchAddresses error:", msg);
    return { ok: false, message: msg };
  }
}

// ============================================================================
// CREATE / UPDATE ADDRESS (UPSERT)
// ----------------------------------------------------------------------------
// If input.id exists → PUT /api/addresses/{id}
// Otherwise → POST /api/addresses
//
// Body is converted to PascalCase to match backend APIs.
// ============================================================================
export async function upsertAddress(
  _userId: string,
  input: Pick<UserAddress, "label" | "addressLine" | "pincode" | "city" | "lat" | "lng"> & {
    id?: string;
    makeDefault?: boolean;
  }
): Promise<ApiResponse<UserAddress>> {
  const body = {
    Label: input.label,
    AddressLine: input.addressLine,
    Pincode: input.pincode,
    City: input.city,
    Lat: input.lat,
    Lng: input.lng,
    IsDefault: !!input.makeDefault,
  };

  const path = input.id ? `/api/addresses/${input.id}` : "/api/addresses";
  const method = input.id ? "PUT" : "POST";

  console.log("[addressApi] upsertAddress start:", {
    method,
    path,
    makeDefault: !!input.makeDefault,
    hasCoords: !!input.lat && !!input.lng,
  });

  try {
    const res = await apiJson<{ Data: any }>(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const mapped = mapAddress(res.Data);
    console.log("[addressApi] upsertAddress success:", { id: mapped.id, isDefault: mapped.isDefault });
    return { ok: true, data: mapped };
  } catch (e: any) {
    const msg = e?.message ?? "Failed to save address";
    console.log("[addressApi] upsertAddress error:", msg);
    return { ok: false, message: msg };
  }
}

// ============================================================================
// DELETE ADDRESS
// ----------------------------------------------------------------------------
// Straight delete API call.
// ============================================================================
export async function deleteAddress(
  id: string
): Promise<ApiResponse<{ id: string }>> {
  console.log("[addressApi] deleteAddress start:", id);

  try {
    await apiJson<void>(`/api/addresses/${id}`, { method: "DELETE" });
    console.log("[addressApi] deleteAddress success:", id);
    return { ok: true, data: { id } };
  } catch (e: any) {
    const msg = e?.message ?? "Failed to delete address";
    console.log("[addressApi] deleteAddress error:", msg);
    return { ok: false, message: msg };
  }
}

// ============================================================================
// SET DEFAULT ADDRESS
// ----------------------------------------------------------------------------
// Backend marks selected address as default.
// ============================================================================
export async function setDefaultAddress(
  _userId: string,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  console.log("[addressApi] setDefaultAddress start:", id);

  try {
    await apiJson<void>(`/api/addresses/${id}/set-default`, {
      method: "POST",
    });
    console.log("[addressApi] setDefaultAddress success:", id);
    return { ok: true, data: { id } };
  } catch (e: any) {
    const msg = e?.message ?? "Failed to set default";
    console.log("[addressApi] setDefaultAddress error:", msg);
    return { ok: false, message: msg };
  }
}