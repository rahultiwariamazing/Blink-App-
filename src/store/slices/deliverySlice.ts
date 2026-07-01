// ============================================================================
// FILE: src/store/slices/deliverySlice.ts
//
// PURPOSE OF THIS SLICE
// ----------------------------------------------------------------------------
// Manages the **currently selected delivery address** for the user.
//
// Responsibilities:
//   ✔ Store selectedAddressId
//   ✔ Allow screens to clear or update it
//   ✔ Provide selector for quick UI access
//
// This slice is intentionally small because the full address list is fetched
// from backend via addressApi + AddressViewModel. The slice only tracks what
// the user has *selected*.
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ STATE LAYER (Delivery Domain)
//    - Holds simple UI state (active address)
//    - Does not call backend
//    - No business rules
//
// ✔ VIEWMODEL LAYER (AddressViewModel)
//    - Controls when to update setSelectedAddressId()
//    - Loads addresses and sets default fallback behavior
//
// ✔ UI LAYER
//    - Reads selectedAddressId to show selected tag, enable checkout, etc.
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// This corresponds to a **DeliveryViewModel** with:
//
//   public string SelectedAddressId { get; set; }
//
// Bound to UI:
//
//   <Picker SelectedItem="{Binding SelectedAddressId}" />
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [deliverySlice]
// - Logs each reducer invocation with the resulting selectedAddressId
// - Keeps logs concise (no PII)
// ----------------------------------------------------------------------------
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No logic changes. Only documentation + safe logs added.
// ============================================================================

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type DeliveryState = {
  selectedAddressId: string | null;
};

const initialState: DeliveryState = {
  selectedAddressId: null,
};

// ============================================================================
// SLICE
// ----------------------------------------------------------------------------
// Holds only a single field and exposes simple update/reset reducers.
// ============================================================================
const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {
    /**
     * setSelectedAddressId
     * ------------------------------------------------------------------------
     * Store the currently used delivery address ID.
     * Typically set when:
     *   - user picks an address
     *   - default address loaded from backend
     */
    setSelectedAddressId(state, action: PayloadAction<string | null>) {
      state.selectedAddressId = action.payload;
      console.log("[deliverySlice] setSelectedAddressId:", action.payload);
    },

    /**
     * clearSelectedAddressId
     * ------------------------------------------------------------------------
     * Used when user logs out or deletes the active address.
     */
    clearSelectedAddressId(state) {
      state.selectedAddressId = null;
      console.log("[deliverySlice] clearSelectedAddressId");
    },
  },
});

// ============================================================================
// EXPORT REDUCER + ACTIONS
// ============================================================================
export const { setSelectedAddressId, clearSelectedAddressId } =
  deliverySlice.actions;

// ============================================================================
// SELECTOR
// ----------------------------------------------------------------------------
// Returns the currently selected delivery address ID.
// ViewModels use this before placing an order.
// ============================================================================
export const selectSelectedAddressId = (state: any) =>
  state.delivery.selectedAddressId as string | null;

export default deliverySlice.reducer;