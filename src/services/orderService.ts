// ============================================================================
// FILE: src/services/orderService.ts
//
// PURPOSE OF THIS SERVICE
// ----------------------------------------------------------------------------
// Handles ALL backend operations for the Orders domain:
//
//   ✔ createOrder()        – place a new order
//   ✔ getOrders()          – list all orders for user
//   ✔ getOrderById()       – fetch a single order’s details
//
// Responsibilities:
//   • Talks to backend using global apiJson<T>()
//   • Parses standardized envelope
//   • Converts PascalCase → camelCase
//   • Maps Status enum (numeric → human-readable string)
//   • Returns FE-ready `Order` models used by OrdersViewModel + UI
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ SERVICE LAYER (Orders Domain)
//    - Contains ONLY data transport + mapping
//    - No UI logic and no Redux logic
//    - Keeps mapping logic consistent, centralized, and testable
//
// ✔ VIEWMODEL LAYER (OrdersViewModel)
//    - Calls getOrders(), getOrderById()
//    - Performs paging, business rules, loading states
//
// ✔ UI LAYER
//    - Displays mapped, clean FE data
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
//   public class OrdersService {
//       Task<List<Order>> GetOrdersAsync();
//       Task<Order> GetOrderByIdAsync(id);
//       Task<string> CreateOrderAsync(addressId);
//   }
//
// Mapping functions = AutoMapper Profile / DTO → Domain Model converter.
//
// STATUS MAPPING
// ----------------------------------------------------------------------------
// Backend returns numeric status codes.  mapStatus() converts:
//   1 → PLACED, 2 → CONFIRMED, 3 → DELIVERED, 4 → CANCELLED
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [orderService]
// - Log request start/end, ids, and mapping counts
// - Never log PII or full payloads
// - Keep logs concise to avoid console noise
// ============================================================================

import { apiJson } from "./apiClient";

export type Order = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
    subtotal: number;
  }[];
};

type ApiEnvelope<T> = {
  Success: boolean;
  StatusCode: number;
  Message: string;
  ErrorCode: string | null;
  TraceId: string;
  Data: T | null;
};

// ============================================================================
// STATUS ENUM MAPPING
// ----------------------------------------------------------------------------
// MAUI equivalent: convert enum int → enum string
// ============================================================================
function mapStatus(s: number): string {
  switch (s) {
    case 1:
      return "PLACED";
    case 2:
      return "CONFIRMED";
    case 3:
      return "DELIVERED";
    case 4:
      return "CANCELLED";
    default:
      return "PLACED";
  }
}

// ============================================================================
// ORDER MODEL MAPPING (PascalCase → camelCase)
// ----------------------------------------------------------------------------
// UI/ViewModel never deals with backend field names.
// Minimal diagnostic log added (no PII).
// ============================================================================
function mapOrder(o: any): Order {
  // Avoid logging full items; just summarize
  // eslint-disable-next-line no-console
  console.log("[orderService] mapOrder:", {
    id: o?.Id,
    status: o?.Status,
    items: Array.isArray(o?.Items) ? o.Items.length : 0,
  });

  return {
    id: o.Id,
    status: mapStatus(o.Status),
    totalAmount: o.TotalAmount,
    createdAt: o.CreatedAt,
    items: (o.Items ?? []).map((x: any) => ({
      id: x.Id,
      productId: x.ProductId,
      productName: x.ProductName,
      quantity: x.Quantity,
      priceAtPurchase: x.PriceAtPurchase,
      subtotal: x.Subtotal,
    })),
  };
}

// ============================================================================
// ENVELOPE PARSER
// ----------------------------------------------------------------------------
// Throws error if backend reports Success:false.
// ============================================================================
async function parseEnvelope<T>(json: any): Promise<T> {
  if (json?.Success === true) {
    return json.Data as T;
  }
  const msg = json?.Message || "Request failed";
  console.log("[orderService] envelope failed:", msg);
  throw new Error(msg);
}

// ============================================================================
// CREATE ORDER
// ----------------------------------------------------------------------------
// Places a new order for selected delivery address.
//
// MAUI equivalent:
//   await OrdersService.CreateOrderAsync(addressId);
// ============================================================================
export async function createOrder(
  payload: { addressId: string }
): Promise<{ orderId: string }> {
  console.log("[orderService] createOrder start:", { addressId: payload.addressId });

  const json = await apiJson<ApiEnvelope<any>>("/api/orders/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ AddressId: payload.addressId }),
  });

  const data = await parseEnvelope<{ orderId: string }>(json);
  console.log("[orderService] createOrder success:", { orderId: data?.orderId });
  return data;
}

// ============================================================================
// GET ALL ORDERS
// ----------------------------------------------------------------------------
// Returns all historical orders for the user.
// Uses mapOrder() to produce FE-ready model.
// ============================================================================
export async function getOrders(): Promise<Order[]> {
  console.log("[orderService] getOrders start");

  const json = await apiJson<ApiEnvelope<any[]>>("/api/orders", {
    method: "GET",
  });

  const list = await parseEnvelope<any[]>(json);
  const mapped = list.map(mapOrder);

  console.log("[orderService] getOrders mapped:", mapped.length);
  return mapped;
}

// ============================================================================
// GET ORDER BY ID
// ----------------------------------------------------------------------------
// Returns a SINGLE order with item-level detail.
// ============================================================================
export async function getOrderById(orderId: string): Promise<Order> {
  console.log("[orderService] getOrderById start:", { orderId });

  const json = await apiJson<ApiEnvelope<any>>(`/api/orders/${orderId}`, {
    method: "GET",
  });

  const raw = await parseEnvelope<any>(json);
  const mapped = mapOrder(raw);

  console.log("[orderService] getOrderById success:", { orderId: mapped.id });
  return mapped;
}