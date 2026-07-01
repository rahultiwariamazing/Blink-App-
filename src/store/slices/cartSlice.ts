import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const findIndex = (items: CartItem[], productId: string) =>
  items.findIndex((x) => x.productId === productId);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<Omit<CartItem, "quantity">>
    ) => {
      const idx = findIndex(state.items, action.payload.productId);
      if (idx >= 0) {
        state.items[idx].quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeFromCart: (state, action: PayloadAction<{ productId: string }>) => {
      const idx = findIndex(state.items, action.payload.productId);
      if (idx >= 0) {
        state.items[idx].quantity -= 1;
        if (state.items[idx].quantity <= 0) {
          state.items.splice(idx, 1);
        }
      }
    },
    setCartQty: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const idx = findIndex(state.items, action.payload.productId);
      if (idx >= 0) {
        state.items[idx].quantity = action.payload.quantity;
        if (state.items[idx].quantity <= 0) {
          state.items.splice(idx, 1);
        }
      }
    },
    deleteCartItem: (state, action: PayloadAction<{ productId: string }>) => {
      state.items = state.items.filter(
        (x) => x.productId !== action.payload.productId
      );
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCartFromServer: (
      state,
      action: PayloadAction<
        {
          productId: string;
          name: string;
          price: number;
          imageUrl?: string;
          quantity: number;
        }[]
      >
    ) => {
      state.items = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  setCartQty,
  deleteCartItem,
  clearCart,
  setCartFromServer,
} = cartSlice.actions;

export default cartSlice.reducer;

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartCount = (state: RootState) =>
  state.cart.items.reduce((sum, x) => sum + x.quantity, 0);

export const selectCartTotal = (state: RootState) =>
  state.cart.items.reduce((sum, x) => sum + x.price * x.quantity, 0);