import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Product } from "@/data/mockData";

export type FulfillmentType = "delivery" | "pickup" | "public_meetup";
export type CartItem = Product & { quantity: number; fulfillmentType: FulfillmentType };

type CartContextValue = {
  items: CartItem[];
  storeId: string | null;
  fulfillmentType: FulfillmentType;
  add: (product: Product, fulfillmentType?: FulfillmentType) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");

  const add = (product: Product, selectedFulfillment: FulfillmentType = fulfillmentType) => {
    if (!product.storeId) return;

    setItems((prev) => {
      // If different store, replace cart
      if (storeId && storeId !== product.storeId) {
        setStoreId(product.storeId);
        setFulfillmentType(selectedFulfillment);
        return [{ ...product, quantity: 1, fulfillmentType: selectedFulfillment }];
      }
      setStoreId(product.storeId);
      setFulfillmentType(selectedFulfillment);
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1, fulfillmentType: selectedFulfillment } : i));
      }
      return [...prev, { ...product, quantity: 1, fulfillmentType: selectedFulfillment }];
    });
  };

  const remove = (productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== productId);
      if (next.length === 0) setStoreId(null);
      return next;
    });
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) return remove(productId);
    setItems((prev) => prev.map((i) => (i.id === productId ? { ...i, quantity: qty } : i)));
  };

  const clear = () => {
    setItems([]);
    setStoreId(null);
    setFulfillmentType("delivery");
  };

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { items, storeId, fulfillmentType, add, remove, setQty, setFulfillmentType, clear, subtotal, count };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, storeId, fulfillmentType]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
