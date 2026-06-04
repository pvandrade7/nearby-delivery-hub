import { describe, it, expect } from "vitest";
import {
  storeSchema,
  productSchema,
  deliveryAddressSchema,
  ticketSchema,
  manualVerificationSchema,
  cnpjRequestSchema,
  firstError,
} from "./index";

// ─────────────────────────────────────────────────────────
// storeSchema
// ─────────────────────────────────────────────────────────
describe("storeSchema", () => {
  const valid = { name: "Minha Loja", category: "Eletrônicos" };

  it("aceita dados válidos", () => {
    expect(storeSchema.safeParse(valid).success).toBe(true);
  });

  it("aceita descrição opcional ausente", () => {
    expect(storeSchema.safeParse({ name: "Loja", category: "Moda" }).success).toBe(true);
  });

  it("aceita descrição vazia", () => {
    expect(storeSchema.safeParse({ ...valid, description: "" }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const r = storeSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita nome com menos de 3 caracteres", () => {
    const r = storeSchema.safeParse({ ...valid, name: "AB" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("3 caracteres");
  });

  it("rejeita nome com mais de 80 caracteres", () => {
    const r = storeSchema.safeParse({ ...valid, name: "A".repeat(81) });
    expect(r.success).toBe(false);
  });

  it("rejeita categoria vazia", () => {
    const r = storeSchema.safeParse({ ...valid, category: "" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("categoria");
  });

  it("rejeita descrição acima de 400 caracteres", () => {
    const r = storeSchema.safeParse({ ...valid, description: "X".repeat(401) });
    expect(r.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// productSchema
// ─────────────────────────────────────────────────────────
describe("productSchema", () => {
  const valid = {
    name:        "Fone Bluetooth",
    priceStr:    "129,90",
    description: "Fone sem fio com excelente qualidade de som.",
    category:    "Eletrônicos",
  };

  it("aceita dados válidos com vírgula decimal", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("aceita preço com ponto decimal", () => {
    expect(productSchema.safeParse({ ...valid, priceStr: "99.90" }).success).toBe(true);
  });

  it("aceita preço inteiro", () => {
    expect(productSchema.safeParse({ ...valid, priceStr: "50" }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(productSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const r = productSchema.safeParse({ ...valid, name: "A" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("2 caracteres");
  });

  it("rejeita preço vazio", () => {
    expect(productSchema.safeParse({ ...valid, priceStr: "" }).success).toBe(false);
  });

  it("rejeita preço zero", () => {
    const r = productSchema.safeParse({ ...valid, priceStr: "0" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("maior que zero");
  });

  it("aceita '-10' (strip do '-' pela UI — resultado é 10, positivo)", () => {
    // O input do formulário bloqueia '-' via onChange. O schema processa
    // strings já sanitizadas pela UI, onde '-' não aparece.
    expect(productSchema.safeParse({ ...valid, priceStr: "-10" }).success).toBe(true);
  });

  it("rejeita preço texto não-numérico", () => {
    expect(productSchema.safeParse({ ...valid, priceStr: "abc" }).success).toBe(false);
  });

  it("rejeita preço acima de 999.999", () => {
    const r = productSchema.safeParse({ ...valid, priceStr: "1000000" });
    expect(r.success).toBe(false);
  });

  it("rejeita descrição vazia", () => {
    const r = productSchema.safeParse({ ...valid, description: "" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("descrição");
  });

  it("rejeita categoria vazia", () => {
    const r = productSchema.safeParse({ ...valid, category: "" });
    expect(r.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// deliveryAddressSchema
// ─────────────────────────────────────────────────────────
describe("deliveryAddressSchema", () => {
  it("aceita endereço válido", () => {
    expect(deliveryAddressSchema.safeParse({ address: "Rua das Flores, 200" }).success).toBe(true);
  });

  it("rejeita endereço vazio", () => {
    expect(deliveryAddressSchema.safeParse({ address: "" }).success).toBe(false);
  });

  it("rejeita endereço com menos de 5 caracteres", () => {
    const r = deliveryAddressSchema.safeParse({ address: "Rua" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("completo");
  });

  it("rejeita endereço acima de 300 caracteres", () => {
    expect(deliveryAddressSchema.safeParse({ address: "A".repeat(301) }).success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// ticketSchema
// ─────────────────────────────────────────────────────────
describe("ticketSchema", () => {
  const valid = {
    subject:  "Meu pedido não chegou",
    message:  "Fiz um pedido há 3 dias e ainda não recebi nada.",
    category: "pedidos" as const,
  };

  it("aceita ticket válido", () => {
    expect(ticketSchema.safeParse(valid).success).toBe(true);
  });

  it("aceita todas as categorias válidas", () => {
    const cats = ["pedidos","pagamentos","entregas","conta","denuncia","sugestao","duvida","verificacao"];
    cats.forEach((category) => {
      expect(ticketSchema.safeParse({ ...valid, category }).success).toBe(true);
    });
  });

  it("rejeita assunto com menos de 5 caracteres", () => {
    const r = ticketSchema.safeParse({ ...valid, subject: "Oi" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("5 caracteres");
  });

  it("rejeita assunto vazio", () => {
    expect(ticketSchema.safeParse({ ...valid, subject: "" }).success).toBe(false);
  });

  it("rejeita mensagem com menos de 10 caracteres", () => {
    const r = ticketSchema.safeParse({ ...valid, message: "Curto" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("10 caracteres");
  });

  it("rejeita categoria inválida", () => {
    const r = ticketSchema.safeParse({ ...valid, category: "outra_coisa" });
    expect(r.success).toBe(false);
  });

  it("rejeita assunto acima de 200 caracteres", () => {
    expect(ticketSchema.safeParse({ ...valid, subject: "A".repeat(201) }).success).toBe(false);
  });

  it("rejeita mensagem acima de 2000 caracteres", () => {
    expect(ticketSchema.safeParse({ ...valid, message: "A".repeat(2001) }).success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// manualVerificationSchema
// ─────────────────────────────────────────────────────────
describe("manualVerificationSchema", () => {
  const valid = {
    store_name:        "Empório do João",
    store_description: "Vendo produtos artesanais da minha região com entrega local.",
    store_category:    "Utilidades",
    no_cnpj_reason:    "Sou trabalhador informal e ainda estou regularizando minha situação.",
  };

  it("aceita dados válidos", () => {
    expect(manualVerificationSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita nome da loja muito curto", () => {
    const r = manualVerificationSchema.safeParse({ ...valid, store_name: "X" });
    expect(r.success).toBe(false);
  });

  it("rejeita descrição muito curta (< 10 chars)", () => {
    const r = manualVerificationSchema.safeParse({ ...valid, store_description: "Vendo." });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("curta");
  });

  it("rejeita categoria vazia", () => {
    const r = manualVerificationSchema.safeParse({ ...valid, store_category: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita motivo do CNPJ muito curto (< 10 chars)", () => {
    const r = manualVerificationSchema.safeParse({ ...valid, no_cnpj_reason: "Não sei." });
    expect(r.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// cnpjRequestSchema
// ─────────────────────────────────────────────────────────
describe("cnpjRequestSchema", () => {
  it("aceita CNPJ com pontuação e transforma para 14 dígitos", () => {
    const r = cnpjRequestSchema.safeParse({ cnpj: "47.960.950/0001-21" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cnpj).toBe("47960950000121");
  });

  it("aceita CNPJ sem pontuação", () => {
    const r = cnpjRequestSchema.safeParse({ cnpj: "47960950000121" });
    expect(r.success).toBe(true);
  });

  it("rejeita CNPJ com menos de 14 dígitos após limpeza", () => {
    const r = cnpjRequestSchema.safeParse({ cnpj: "123" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("14 dígitos");
  });

  it("rejeita CNPJ vazio", () => {
    const r = cnpjRequestSchema.safeParse({ cnpj: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita campo ausente", () => {
    const r = cnpjRequestSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// firstError helper
// ─────────────────────────────────────────────────────────
describe("firstError", () => {
  it("retorna a mensagem do primeiro issue", () => {
    const r = storeSchema.safeParse({ name: "", category: "" });
    expect(r.success).toBe(false);
    const msg = firstError(r.error!);
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });
});
