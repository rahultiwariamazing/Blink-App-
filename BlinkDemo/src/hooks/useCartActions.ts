import { useCallback, useState } from "react";
import { useAppDispatch } from "../store/hooks";
import {
  addToCart,
  removeFromCart,
  setCartQty,
  deleteCartItem,
} from "../store/slices/cartSlice";
import { useToast } from "../components/Toast/ToastProvider";

import {
  upsertCartItem,
  deleteCartItem as apiDeleteCartItem,
} from "../services/cartApi";

type ProductLite = { id: string; name: string; price: number; image?: string };

export function useCartActions() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  // Prevent duplicate requests for the same product while a previous request is in flight.
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  const lock = (id: string) => {
    setBusyMap((m) => ({ ...m, [id]: true }));
  };
  const unlock = (id: string) => {
    setBusyMap((m) => ({ ...m, [id]: false }));
  };

  const addItem = useCallback(
    async (it: ProductLite) => {
      if (busyMap[it.id]) {
        return;
      }
      lock(it.id);

      dispatch(
        addToCart({
          productId: it.id,
          name: it.name,
          price: it.price,
          imageUrl: it.image ?? "",
        })
      );

      try {
        await upsertCartItem(it.id, 1);
        showToast("Added to cart", { type: "success" });
      } catch {
        // Revert optimistic update when server sync fails.
        dispatch(removeFromCart({ productId: it.id }));
        showToast("Failed to update cart", { type: "error" });
      }

      unlock(it.id);
    },
    [dispatch, showToast, busyMap]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (busyMap[id]) {
        return;
      }
      lock(id);

      dispatch(removeFromCart({ productId: id }));

      try {
        await upsertCartItem(id, -1);
        showToast("Updated cart", { type: "info" });
      } catch {
        showToast("Failed to update cart", { type: "error" });
      }

      unlock(id);
    },
    [dispatch, showToast, busyMap]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (busyMap[id]) {
        return;
      }
      lock(id);

      dispatch(deleteCartItem({ productId: id }));

      try {
        await apiDeleteCartItem(id);
        showToast("Removed from cart", { type: "info" });
      } catch {
        showToast("Failed to update cart", { type: "error" });
      }

      unlock(id);
    },
    [dispatch, showToast, busyMap]
  );

  const setQty = useCallback(
    async (id: string, quantity: number) => {
      if (busyMap[id]) {
        return;
      }
      lock(id);

      dispatch(setCartQty({ productId: id, quantity }));

      try {
        await upsertCartItem(id, quantity);
        showToast("Cart updated", { type: "info" });
      } catch {
        showToast("Failed to update cart", { type: "error" });
      }

      unlock(id);
    },
    [dispatch, showToast, busyMap]
  );

  return { addItem, removeItem, deleteItem, setQty, busyMap };
}