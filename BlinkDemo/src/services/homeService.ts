// ============================================================================
// FILE: src/services/homeService.ts
//
// PURPOSE OF THIS SERVICE
// ----------------------------------------------------------------------------
// Central catalog data provider responsible for fetching:
//
//   ✔ Categories
//   ✔ Subcategories
//   ✔ Products (optionally filtered by category)
//   ✔ Product search results
//
// Responsibilities:
//   - Calls backend through global apiJson<T>()
//   - Parses standard API envelope
//   - Maps PascalCase → camelCase for all catalog models
//   - Returns FE-friendly typed models
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ SERVICE LAYER (Domain: Catalog)
//    - Pure backend communication
//    - No UI logic
//    - No Redux or navigation
//    - Ensures FE models are always clean and consistent
//
// ✔ VIEWMODEL LAYER (HomeViewModel / Search View logic)
//    - Calls fetchCategories(), fetchItems(), searchProducts(), etc.
//    - Handles pagination, filtering, loading states
//
// ✔ UI LAYER
//    - Renders categories, items, search results
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// Equivalent to a CatalogService.cs:
//
//   public class CatalogService {
//       Task<List<Category>> FetchCategoriesAsync();
//       Task<List<Subcategory>> FetchSubcategoriesAsync(id);
//       Task<List<Item>> FetchItemsAsync(categoryId);
//       Task<List<Item>> SearchAsync(query);
//   }
//
// Mapping functions here resemble AutoMapper profiles in MAUI.
//
// PASCALCASE → CAMELCASE
// ----------------------------------------------------------------------------
// Backend returns models like: { "Id": "...", "Name": "...", "ImageUrl": "..." }
// FE expects:                 {  id: "...",   name: "...",   image: "..."      }
// Mapping is centralized here to keep UI lean.
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [catalogService]
// - Log request start/end with route & key params
// - Log list sizes and mapping results
// - Never log full payloads or PII
// ============================================================================

/**
 * Catalog Service (MVVM Service Layer)
 * - Uses apiJson<T>() with envelope parsing
 * - Maps PascalCase (BE) -> camelCase (FE)
 * - Provides: categories, subcategories, products (with optional category filter), search
 *
 * MAUI-friendly note:
 * Keep data access/mapping in the Service layer (Repository/Service),
 * and keep UI/ViewModels free from transport concerns.
 */

import { Category, Subcategory, Item } from "../models/HomeModels";
import { apiJson } from "./apiClient";

// ============================================================================
// ENVELOPE TYPE (optional backend support)
// Used by apiGet wrapper for consistent envelope validation
// ============================================================================
type ApiEnvelope<T> = {
  Success: boolean;
  StatusCode: number;
  Message: string;
  ErrorCode: string | null;
  TraceId: string;
  Data: T | null;
};

// ============================================================================
// GENERIC GET WRAPPER
// ----------------------------------------------------------------------------
// Wraps apiJson<T> but understands our envelope format.
// ============================================================================
async function apiGet<T>(path: string): Promise<T> {
  console.log("[catalogService] GET:", path);
  const json = await apiJson<any>(path, {
    method: "GET",
    headers: { Accept: "application/json" }, // Some servers require Accept header
  });

  if (json && typeof json === "object" && "Success" in json && "Data" in json) {
    const env = json as ApiEnvelope<T>;
    if (env.Success === true) {
      const data = (env.Data ?? ([] as any)) as T;
      if (Array.isArray(data)) {
        console.log("[catalogService] GET success; items:", data.length);
      } else {
        console.log("[catalogService] GET success (envelope)");
      }
      return data;
    }
    console.log("[catalogService] GET envelope failure:", env.Message);
    throw new Error(env.Message || "Request failed");
  }

  console.log("[catalogService] GET success (non-envelope)");
  return json as T;
}

// ============================================================================
// MAPPING HELPERS (PascalCase → camelCase)
// ----------------------------------------------------------------------------
// Central location for backend → FE conversion.
// UI & ViewModels never deal with raw backend field names.
// ============================================================================

const mapCategory = (c: any): Category => ({
  id: String(c.id ?? c.Id),
  name: String(c.name ?? c.Name),
  icon: c.icon ?? c.IconUrl ?? c.ImageUrl ?? undefined, // BE flexibility
});

const mapSubcategory = (s: any): Subcategory => ({
  id: String(s.id ?? s.Id),
  categoryId: String(s.categoryId ?? s.CategoryId),
  name: String(s.name ?? s.Name),
});

const mapItem = (p: any): Item => ({
  id: String(p.id ?? p.Id),
  subcategoryId: String(p.subcategoryId ?? p.SubcategoryId),
  name: String(p.name ?? p.Name),
  price: Number(p.price ?? p.Price ?? 0),
  image: String(p.imageUrl ?? p.ImageUrl ?? ""),
  description: String(p.description ?? p.Description ?? ""),
});

// ============================================================================
// PUBLIC API METHODS
// ----------------------------------------------------------------------------
// All returning FE-typed models, already camelCased, safe for ViewModels.
// ============================================================================

/**
 * fetchCategories()
 * ---------------------------------------------------------------------------
 * Returns all categories in FE-ready format.
 *
 * MAUI equivalent:
 *   await CatalogService.FetchCategoriesAsync();
 */
export async function fetchCategories(): Promise<Category[]> {
  const rows = await apiGet<any[]>(`/api/catalog/categories`);
  const mapped = rows.map(mapCategory);
  console.log("[catalogService] fetchCategories mapped:", mapped.length);
  return mapped;
}

/**
 * fetchSubcategories(categoryId)
 * ---------------------------------------------------------------------------
 * Returns subcategories belonging to a category.
 *
 * MAUI equivalent:
 *   await CatalogService.FetchSubcategoriesAsync(categoryId);
 */
export async function fetchSubcategories(categoryId: string): Promise<Subcategory[]> {
  console.log("[catalogService] fetchSubcategories param:", { categoryId });
  const rows = await apiGet<any[]>(
    `/api/catalog/subcategories?categoryId=${encodeURIComponent(categoryId)}`
  );
  const mapped = rows.map(mapSubcategory);
  console.log("[catalogService] fetchSubcategories mapped:", mapped.length);
  return mapped;
}

/**
 * fetchItems(categoryId?)
 * ---------------------------------------------------------------------------
 * - If categoryId provided → backend filters via query param
 * - If not → returns all products
 *
 * MAUI equivalent:
 *   await CatalogService.FetchItemsAsync(optionalCategoryId);
 */
export async function fetchItems(categoryId?: string): Promise<Item[]> {
  const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  console.log("[catalogService] fetchItems param:", { categoryId });
  const rows = await apiGet<any[]>(`/api/catalog/products${qs}`);
  const mapped = rows.map(mapItem);
  console.log("[catalogService] fetchItems mapped:", mapped.length);
  return mapped;
}

/**
 * searchProducts(query)
 * ---------------------------------------------------------------------------
 * Returns items whose name or description matches text.
 *
 * Backend endpoint: /api/catalog/search?q=...
 *
 * MAUI equivalent:
 *   await CatalogService.SearchAsync(query);
 */
export async function searchProducts(q: string): Promise<Item[]> {
  const query = (q ?? "").trim();
  if (query.length === 0) {
    console.log("[catalogService] searchProducts empty query → []");
    return [];
  }

  console.log("[catalogService] searchProducts param:", { query });
  const rows = await apiGet<any[]>(
    `/api/catalog/search?q=${encodeURIComponent(query)}`
  );
  const mapped = rows.map(mapItem);
  console.log("[catalogService] searchProducts mapped:", mapped.length);
  return mapped;
}