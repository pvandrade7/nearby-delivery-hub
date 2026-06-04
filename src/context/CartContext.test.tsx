import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";
import type { Product } from "@/data/mockData";

// ── Produtos de teste ─────────────────────────────────────
const p1: Product = {
  id: "prod-1",
  storeId: "store-a",
  name: "Produto 1",
  price: 10.0,
  description: "Desc 1",
  category: "eletronicos",
  image: "/img1.jpg",
};

const p2: Product = {
  id: "prod-2",
  storeId: "store-a",
  name: "Produto 2",
  price: 25.0,
  description: "Desc 2",
  category: "moda",
  image: "/img2.jpg",
};

const pOutraLoja: Product = {
  id: "prod-3",
  storeId: "store-b",  // loja diferente
  name: "Produto Outra Loja",
  price: 50.0,
  description: "Desc 3",
  category: "farmacia",
  image: "/img3.jpg",
};

const pSemLoja: Product = {
  id: "prod-4",
  // storeId ausente
  name: "Produto Sem Loja",
  price: 5.0,
  description: "Desc 4",
  category: "outros",
  image: "/img4.jpg",
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

// ─────────────────────────────────────────────────────────
// Estado inicial
// ─────────────────────────────────────────────────────────
describe("CartContext — estado inicial", () => {
  it("começa com carrinho vazio", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.storeId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────
// add()
// ─────────────────────────────────────────────────────────
describe("CartContext — add()", () => {
  it("adiciona item novo ao carrinho", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe("prod-1");
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.storeId).toBe("store-a");
  });

  it("incrementa quantidade ao adicionar produto já existente", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.add(p1); });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("adiciona segundo produto da mesma loja sem limpar", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.add(p2); });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.storeId).toBe("store-a");
  });

  // ── TESTE CRÍTICO: race condition fix ──────────────────
  it("limpa o carrinho e reinicia ao adicionar produto de outra loja", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => { result.current.add(p1); });
    expect(result.current.storeId).toBe("store-a");
    expect(result.current.items).toHaveLength(1);

    act(() => { result.current.add(pOutraLoja); });

    // Deve ter apenas o produto da nova loja
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe("prod-3");
    expect(result.current.storeId).toBe("store-b");
  });

  it("ignora produto sem storeId", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(pSemLoja); });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.storeId).toBeNull();
  });

  it("define o fulfillmentType especificado", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1, "pickup"); });

    expect(result.current.fulfillmentType).toBe("pickup");
    expect(result.current.items[0].fulfillmentType).toBe("pickup");
  });

  it("usa o fulfillmentType padrão (delivery) quando não especificado", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });

    expect(result.current.fulfillmentType).toBe("delivery");
  });
});

// ─────────────────────────────────────────────────────────
// remove()
// ─────────────────────────────────────────────────────────
describe("CartContext — remove()", () => {
  it("remove item pelo id", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); result.current.add(p2); });
    act(() => { result.current.remove("prod-1"); });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe("prod-2");
  });

  it("zera storeId quando último item é removido", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.remove("prod-1"); });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.storeId).toBeNull();
  });

  it("não lança erro ao remover id inexistente", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    expect(() => { act(() => { result.current.remove("nao-existe"); }); }).not.toThrow();
    expect(result.current.items).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────
// setQty()
// ─────────────────────────────────────────────────────────
describe("CartContext — setQty()", () => {
  it("atualiza quantidade corretamente", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.setQty("prod-1", 5); });

    expect(result.current.items[0].quantity).toBe(5);
  });

  it("remove item quando quantidade é 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.setQty("prod-1", 0); });

    expect(result.current.items).toHaveLength(0);
  });

  it("remove item quando quantidade é negativa", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.setQty("prod-1", -3); });

    expect(result.current.items).toHaveLength(0);
  });

  it("limita quantidade ao máximo de 99", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.setQty("prod-1", 999); });

    expect(result.current.items[0].quantity).toBe(99);
  });
});

// ─────────────────────────────────────────────────────────
// clear()
// ─────────────────────────────────────────────────────────
describe("CartContext — clear()", () => {
  it("esvazia o carrinho completamente", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.add(p1);
      result.current.add(p2);
    });
    act(() => { result.current.clear(); });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.storeId).toBeNull();
    expect(result.current.fulfillmentType).toBe("delivery");
  });
});

// ─────────────────────────────────────────────────────────
// subtotal e count
// ─────────────────────────────────────────────────────────
describe("CartContext — subtotal e count", () => {
  it("calcula subtotal corretamente com múltiplos itens e quantidades", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.add(p1); // 10.00
      result.current.add(p1); // +10.00 = 20.00
      result.current.add(p2); // +25.00 = 45.00
    });

    expect(result.current.subtotal).toBeCloseTo(45.0);
  });

  it("conta total de unidades corretamente", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.add(p1);
      result.current.add(p1);
      result.current.add(p2);
    });

    expect(result.current.count).toBe(3); // 2x p1 + 1x p2
  });

  it("subtotal é 0 com carrinho vazio", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.subtotal).toBe(0);
  });

  it("atualiza subtotal após setQty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(p1); });
    act(() => { result.current.setQty("prod-1", 3); });

    expect(result.current.subtotal).toBeCloseTo(30.0);
  });
});
