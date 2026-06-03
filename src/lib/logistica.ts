import type { Logistica, PorteProduto, TipoEntrega } from "@/data/mockData";

/* ── Labels ──────────────────────────────────────────── */

export const PORTE_LABEL: Record<PorteProduto, string> = {
  P:  "Pequeno",
  M:  "Médio",
  G:  "Grande",
  GG: "Muito Grande",
};

export const PORTE_DESC: Record<PorteProduto, string> = {
  P:  "Cabe em sacola/envelope (≤ 2 kg)",
  M:  "Cabe no porta-malas (2–15 kg)",
  G:  "Necessita van ou veículo grande (15–50 kg)",
  GG: "Necessita caminhonete ou equipe especializada (> 50 kg)",
};

export const ENTREGA_LABEL: Record<TipoEntrega, string> = {
  motoboy:  "Motoboy parceiro",
  carro:    "Carro parceiro",
  loja:     "Entrega pela loja",
  retirada: "Somente retirada",
  combinado:"Combinar com vendedor",
  servico:  "Leve até a loja",
};

export const ENTREGA_DESC: Record<TipoEntrega, string> = {
  motoboy:  "Produto enviado por mototaxi ou carro parceiro",
  carro:    "Produto enviado exclusivamente por carro parceiro",
  loja:     "A loja realiza a entrega com equipe e veículo próprios",
  retirada: "Produto deve ser retirado no local — não pode ser transportado por veículo comum",
  combinado:"Acorde o método de entrega diretamente com o vendedor via chat",
  servico:  "Traga o item até a loja; o serviço é realizado no local",
};

export const ENTREGA_ICON: Record<TipoEntrega, string> = {
  motoboy:  "🛵",
  carro:    "🚗",
  loja:     "🏪",
  retirada: "📍",
  combinado:"🤝",
  servico:  "🔧",
};

export const PORTE_COLOR: Record<PorteProduto, string> = {
  P:  "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  M:  "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  G:  "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
  GG: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
};

export const ENTREGA_COLOR: Record<TipoEntrega, string> = {
  motoboy:  "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  carro:    "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  loja:     "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
  retirada: "text-muted-foreground bg-muted",
  combinado:"text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  servico:  "text-sky-700 bg-sky-100 dark:text-sky-400 dark:bg-sky-900/30",
};

/* ── Helpers ─────────────────────────────────────────── */

export function formatPeso(kg: number): string {
  if (kg === 0) return "—";
  return kg < 1 ? `${(kg * 1000).toFixed(0)} g` : `${kg.toLocaleString("pt-BR")} kg`;
}

export function formatDims([a, l, c]: [number, number, number]): string {
  if (a === 0 && l === 0 && c === 0) return "—";
  return `${a} × ${l} × ${c} cm`;
}

/** Retorna true se um motoboy de bicicleta/moto comum consegue carregar */
export function podeMotoboyBicicleta(log: Logistica): boolean {
  return log.porte === "P" && log.temEmbalagem && log.entrega === "motoboy";
}

/** Retorna true se precisa de veículo especializado (não carro de passeio) */
export function precisaVeiculoEspecializado(log: Logistica): boolean {
  return log.porte === "GG" || log.entrega === "loja" || log.entrega === "retirada";
}

export function taxaLabel(taxa: number | undefined): string {
  if (taxa === undefined) return "A definir";
  if (taxa === 0) return "Frete grátis";
  return `R$ ${taxa.toFixed(2)}`;
}
