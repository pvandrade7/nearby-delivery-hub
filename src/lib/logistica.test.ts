import { describe, it, expect } from "vitest";
import {
  formatPeso,
  formatDims,
  podeMotoboyBicicleta,
  precisaVeiculoEspecializado,
  taxaLabel,
} from "./logistica";
import type { Logistica } from "@/data/mockData";

// ── Fixture base ──────────────────────────────────────────
const baseLog: Logistica = {
  peso: 0.5,
  dims: [10, 15, 5],
  porte: "P",
  temEmbalagem: true,
  entrega: "motoboy",
};

// ─────────────────────────────────────────────────────────
// formatPeso
// ─────────────────────────────────────────────────────────
describe("formatPeso", () => {
  it("retorna '—' para peso zero (serviço)", () => {
    expect(formatPeso(0)).toBe("—");
  });

  it("converte para gramas abaixo de 1 kg", () => {
    expect(formatPeso(0.5)).toBe("500 g");
    expect(formatPeso(0.25)).toBe("250 g");
  });

  it("formata kg com localização pt-BR", () => {
    expect(formatPeso(1)).toBe("1 kg");
    expect(formatPeso(15)).toBe("15 kg");
  });

  it("formata valores grandes corretamente", () => {
    expect(formatPeso(1000)).toContain("kg");
  });
});

// ─────────────────────────────────────────────────────────
// formatDims
// ─────────────────────────────────────────────────────────
describe("formatDims", () => {
  it("retorna '—' quando todas as dimensões são zero", () => {
    expect(formatDims([0, 0, 0])).toBe("—");
  });

  it("formata dimensões no padrão 'A × L × C cm'", () => {
    expect(formatDims([10, 20, 30])).toBe("10 × 20 × 30 cm");
  });

  it("formata dimensões assimétricas", () => {
    expect(formatDims([5, 5, 100])).toBe("5 × 5 × 100 cm");
  });
});

// ─────────────────────────────────────────────────────────
// podeMotoboyBicicleta
// ─────────────────────────────────────────────────────────
describe("podeMotoboyBicicleta", () => {
  it("retorna true para produto P com embalagem e entrega motoboy", () => {
    expect(podeMotoboyBicicleta(baseLog)).toBe(true);
  });

  it("retorna false se porte não for P", () => {
    expect(podeMotoboyBicicleta({ ...baseLog, porte: "M" })).toBe(false);
    expect(podeMotoboyBicicleta({ ...baseLog, porte: "G" })).toBe(false);
    expect(podeMotoboyBicicleta({ ...baseLog, porte: "GG" })).toBe(false);
  });

  it("retorna false se não tiver embalagem", () => {
    expect(podeMotoboyBicicleta({ ...baseLog, temEmbalagem: false })).toBe(false);
  });

  it("retorna false se tipo de entrega não for motoboy", () => {
    expect(podeMotoboyBicicleta({ ...baseLog, entrega: "carro" })).toBe(false);
    expect(podeMotoboyBicicleta({ ...baseLog, entrega: "loja" })).toBe(false);
    expect(podeMotoboyBicicleta({ ...baseLog, entrega: "retirada" })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// precisaVeiculoEspecializado
// ─────────────────────────────────────────────────────────
describe("precisaVeiculoEspecializado", () => {
  it("retorna false para produto P com motoboy", () => {
    expect(precisaVeiculoEspecializado(baseLog)).toBe(false);
  });

  it("retorna true para porte GG", () => {
    expect(precisaVeiculoEspecializado({ ...baseLog, porte: "GG" })).toBe(true);
  });

  it("retorna true para entrega tipo 'loja'", () => {
    expect(precisaVeiculoEspecializado({ ...baseLog, entrega: "loja" })).toBe(true);
  });

  it("retorna true para entrega tipo 'retirada'", () => {
    expect(precisaVeiculoEspecializado({ ...baseLog, entrega: "retirada" })).toBe(true);
  });

  it("retorna false para porte G sem tipo especial", () => {
    expect(precisaVeiculoEspecializado({ ...baseLog, porte: "G", entrega: "carro" })).toBe(false);
  });

  it("retorna false para entrega combinado", () => {
    expect(precisaVeiculoEspecializado({ ...baseLog, entrega: "combinado" })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// taxaLabel
// ─────────────────────────────────────────────────────────
describe("taxaLabel", () => {
  it("retorna 'A definir' quando taxa é undefined", () => {
    expect(taxaLabel(undefined)).toBe("A definir");
  });

  it("retorna 'Frete grátis' quando taxa é 0", () => {
    expect(taxaLabel(0)).toBe("Frete grátis");
  });

  it("formata valor com duas casas decimais", () => {
    expect(taxaLabel(6.9)).toBe("R$ 6.90");
    expect(taxaLabel(10)).toBe("R$ 10.00");
    expect(taxaLabel(15.5)).toBe("R$ 15.50");
  });
});
