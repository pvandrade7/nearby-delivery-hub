import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Product } from "@/data/mockData";

type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  storeId: string | null;
  add: (product: Product) => void;
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

  const add = (product: Product) => {
    if (!product.storeId) return;

    setItems((prev) => {
      // If different store, replace cart
      if (storeId && storeId !== product.storeId) {
        setStoreId(product.storeId);
        return [{ ...product, quantity: 1 }];
      }
      setStoreId(product.storeId);
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...product, quantity: 1 }];
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
  };

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { items, storeId, add, remove, setQty, clear, subtotal, count };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, storeId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
