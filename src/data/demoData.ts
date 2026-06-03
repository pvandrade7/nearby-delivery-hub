/**
 * Dados centralizados para o Modo Demonstração da plataforma Vendy+.
 * Simula uma loja de acessórios tech em plena operação há ~5 meses.
 * Não afeta dados reais no Supabase.
 */

// ── helpers de data ──────────────────────────────────────
const _now = new Date();
const ago = (days: number, hours = 0): string => {
  const d = new Date(_now);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};

// ── Perfil da loja demo ──────────────────────────────────
export const DEMO_STORE = {
  storeName:    "TechZone Acessórios",
  ownerName:    "Carlos Mendes",
  email:        "contato@techzone.com.br",
  phone:        "(85) 9 9876-5432",
  whatsapp:     "85998765432",
  address:      "Rua Monsenhor Tabosa, 512 — Meireles, Fortaleza - CE",
  category:     "Eletrônicos",
  instagram:    "@techzone_ce",
  facebook:     "techzonece",
  website:      "www.techzone.com.br",
  description:  "Acessórios de tecnologia com qualidade garantida. Entrega rápida em Fortaleza e região. Fones, carregadores, cabos, capinhas e muito mais.",
  rating:       4.8,
  totalReviews: 127,
  since:        "Janeiro de 2024",
};

// ── Produtos ─────────────────────────────────────────────
export type DemoProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  sold: number;
  rating: number;
  active: boolean;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "dp-001",
    name: "Fone Bluetooth TWS Pro",
    description: "Fone sem fio com cancelamento de ruído, 30h de bateria e estojo de carregamento.",
    price: 129.90,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=75",
    category: "Fones",
    stock: 47,
    sold: 214,
    rating: 4.9,
    active: true,
  },
  {
    id: "dp-002",
    name: "Carregador Turbo 65W USB-C",
    description: "Carregamento rápido compatível com notebooks, celulares e tablets. GaN Technology.",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&q=75",
    category: "Carregadores",
    stock: 83,
    sold: 189,
    rating: 4.8,
    active: true,
  },
  {
    id: "dp-003",
    name: "Power Bank 20.000mAh",
    description: "Carregador portátil com display LED, 3 portas USB e carregamento rápido 22.5W.",
    price: 189.90,
    image: "https://images.unsplash.com/photo-1610438235354-a6ae5528385c?w=200&q=75",
    category: "Carregadores",
    stock: 29,
    sold: 97,
    rating: 4.7,
    active: true,
  },
  {
    id: "dp-004",
    name: "Cabo USB-C 2m Nylon",
    description: "Cabo trançado resistente com carga rápida 60W. Compatível com todos os USB-C.",
    price: 34.90,
    image: "https://images.unsplash.com/photo-1583394293214-4f6a72b61ed3?w=200&q=75",
    category: "Cabos",
    stock: 156,
    sold: 342,
    rating: 4.6,
    active: true,
  },
  {
    id: "dp-005",
    name: "Suporte Veicular Magnético",
    description: "Fixação no painel ou ventilação. Rotação 360°. Compatível com todos os celulares.",
    price: 69.90,
    image: "https://images.unsplash.com/photo-1601524909162-ae8725290836?w=200&q=75",
    category: "Acessórios",
    stock: 64,
    sold: 156,
    rating: 4.8,
    active: true,
  },
  {
    id: "dp-006",
    name: "Mouse Sem Fio Silencioso",
    description: "Mouse 2.4GHz com receptor USB. Silencioso, ergonômico, 1600 DPI. Bateria AA.",
    price: 149.90,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&q=75",
    category: "Periféricos",
    stock: 18,
    sold: 73,
    rating: 4.7,
    active: true,
  },
  {
    id: "dp-007",
    name: "Película Vidro 9H Samsung S24",
    description: "Vidro temperado 9H, borda curva. Kit com 2 unidades + aplicador.",
    price: 29.90,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&q=75",
    category: "Proteção",
    stock: 210,
    sold: 428,
    rating: 4.5,
    active: true,
  },
  {
    id: "dp-008",
    name: "Capinha MagSafe iPhone 15",
    description: "Case premium compatível com carregamento MagSafe. Material TPU antiamarelo.",
    price: 49.90,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=75",
    category: "Capinhas",
    stock: 92,
    sold: 267,
    rating: 4.9,
    active: true,
  },
];

// ── Pedidos ───────────────────────────────────────────────
export type DemoOrder = {
  id: string;
  customer: string;
  total: number;
  status: "aprovado" | "preparando" | "saiu" | "entregue" | "cancelado";
  created_at: string;
  items: { name: string; quantity: number; price: number }[];
  payment: string;
  fulfillment: string;
  address: string | null;
};

export const DEMO_ORDERS: DemoOrder[] = [
  { id: "TZ-20240601-001", customer: "Ana Lima",         total: 219.80, status: "entregue",   created_at: ago(0, 2),  items: [{ name: "Fone Bluetooth TWS Pro",   quantity: 1, price: 129.90 }, { name: "Cabo USB-C 2m Nylon",         quantity: 1, price: 34.90 }, { name: "Película Vidro 9H Samsung S24",  quantity: 1, price: 29.90 }], payment: "pix",    fulfillment: "delivery", address: "Rua Tibúrcio Cavalcante, 234 — Meireles" },
  { id: "TZ-20240601-002", customer: "João Silva",       total: 89.90,  status: "preparando", created_at: ago(0, 5),  items: [{ name: "Carregador Turbo 65W USB-C", quantity: 1, price: 89.90 }], payment: "cartao",  fulfillment: "delivery", address: "Av. Beira Mar, 1840 — Meireles" },
  { id: "TZ-20240531-003", customer: "Fernanda Santos",  total: 189.90, status: "saiu",       created_at: ago(1, 3),  items: [{ name: "Power Bank 20.000mAh",      quantity: 1, price: 189.90 }], payment: "pix",    fulfillment: "delivery", address: "Rua Carlos Vasconcelos, 890 — Aldeota" },
  { id: "TZ-20240531-004", customer: "Marcos Oliveira",  total: 149.90, status: "entregue",   created_at: ago(1, 8),  items: [{ name: "Mouse Sem Fio Silencioso",   quantity: 1, price: 149.90 }], payment: "cartao",  fulfillment: "delivery", address: "Rua Silva Jatahy, 120 — Meireles" },
  { id: "TZ-20240530-005", customer: "Juliana Costa",    total: 99.80,  status: "entregue",   created_at: ago(2, 1),  items: [{ name: "Cabo USB-C 2m Nylon",         quantity: 2, price: 34.90 }, { name: "Película Vidro 9H Samsung S24",  quantity: 1, price: 29.90 }], payment: "pix",    fulfillment: "delivery", address: "Av. Santos Dumont, 5335 — Papicu" },
  { id: "TZ-20240530-006", customer: "Rafael Almeida",   total: 179.80, status: "entregue",   created_at: ago(2, 6),  items: [{ name: "Carregador Turbo 65W USB-C", quantity: 2, price: 89.90 }], payment: "pix",    fulfillment: "pickup",   address: null },
  { id: "TZ-20240529-007", customer: "Beatriz Ferreira", total: 269.80, status: "entregue",   created_at: ago(3, 2),  items: [{ name: "Fone Bluetooth TWS Pro",   quantity: 1, price: 129.90 }, { name: "Suporte Veicular Magnético",   quantity: 1, price: 69.90 }], payment: "cartao",  fulfillment: "delivery", address: "Rua Desembargador Moreira, 1200 — Aldeota" },
  { id: "TZ-20240529-008", customer: "Lucas Martins",    total: 49.90,  status: "entregue",   created_at: ago(3, 9),  items: [{ name: "Capinha MagSafe iPhone 15",  quantity: 1, price: 49.90 }], payment: "pix",    fulfillment: "delivery", address: "Rua Nogueira Acioli, 450 — Dionísio Torres" },
  { id: "TZ-20240528-009", customer: "Camila Rodrigues", total: 389.70, status: "entregue",   created_at: ago(4, 4),  items: [{ name: "Power Bank 20.000mAh",      quantity: 1, price: 189.90 }, { name: "Fone Bluetooth TWS Pro",   quantity: 1, price: 129.90 }, { name: "Cabo USB-C 2m Nylon",         quantity: 2, price: 34.90 }], payment: "cartao",  fulfillment: "delivery", address: "Av. Washington Soares, 4335 — Edson Queiroz" },
  { id: "TZ-20240527-010", customer: "Diego Nascimento", total: 69.90,  status: "entregue",   created_at: ago(5, 3),  items: [{ name: "Suporte Veicular Magnético",   quantity: 1, price: 69.90 }], payment: "pix",    fulfillment: "delivery", address: "Rua Oswaldo Cruz, 1550 — Meireles" },
  { id: "TZ-20240526-011", customer: "Tatiane Gomes",    total: 129.90, status: "entregue",   created_at: ago(6, 7),  items: [{ name: "Fone Bluetooth TWS Pro",   quantity: 1, price: 129.90 }], payment: "pix",    fulfillment: "delivery", address: "Av. Monsenhor Tabosa, 801 — Meireles" },
  { id: "TZ-20240525-012", customer: "Felipe Souza",     total: 239.80, status: "entregue",   created_at: ago(7, 2),  items: [{ name: "Mouse Sem Fio Silencioso",   quantity: 1, price: 149.90 }, { name: "Cabo USB-C 2m Nylon",         quantity: 1, price: 34.90 }, { name: "Capinha MagSafe iPhone 15",  quantity: 1, price: 49.90 }], payment: "cartao",  fulfillment: "delivery", address: "Rua Coronel Nunes de Melo, 233 — Rodolfo Teófilo" },
  { id: "TZ-20240520-013", customer: "Isabela Mendes",   total: 59.80,  status: "entregue",   created_at: ago(12, 5), items: [{ name: "Película Vidro 9H Samsung S24",  quantity: 2, price: 29.90 }], payment: "pix",    fulfillment: "pickup",   address: null },
  { id: "TZ-20240515-014", customer: "André Carvalho",   total: 179.80, status: "entregue",   created_at: ago(17, 3), items: [{ name: "Fone Bluetooth TWS Pro",   quantity: 1, price: 129.90 }, { name: "Cabo USB-C 2m Nylon",         quantity: 1, price: 34.90 }], payment: "cartao",  fulfillment: "delivery", address: "Rua Prof. Dias da Rocha, 720 — Aldeota" },
  { id: "TZ-20240510-015", customer: "Priscila Araújo",  total: 189.90, status: "aprovado",   created_at: ago(22, 1), items: [{ name: "Power Bank 20.000mAh",      quantity: 1, price: 189.90 }], payment: "pix",    fulfillment: "delivery", address: "Av. Antônio Sales, 2050 — Joaquim Távora" },
];

// ── Dados mensais para gráficos (últimos 6 meses) ────────
export type MonthData = { month: string; receita: number; pedidos: number; meta: number };

export const DEMO_MONTHLY: MonthData[] = [
  { month: "Jan",  receita: 3240,  pedidos: 28,  meta: 3000 },
  { month: "Fev",  receita: 4180,  pedidos: 36,  meta: 3500 },
  { month: "Mar",  receita: 5360,  pedidos: 47,  meta: 4500 },
  { month: "Abr",  receita: 4920,  pedidos: 43,  meta: 5000 },
  { month: "Mai",  receita: 6840,  pedidos: 59,  meta: 5500 },
  { month: "Jun",  receita: 2190,  pedidos: 19,  meta: 6000 }, // mês parcial
];

// ── Avaliações ────────────────────────────────────────────
export type DemoReview = {
  id: string;
  customer: string;
  rating: number;
  comment: string;
  product: string;
  ago: string;
};

export const DEMO_REVIEWS: DemoReview[] = [
  { id: "rv-1", customer: "Ana Lima",         rating: 5, comment: "Fone incrível! Qualidade de som excelente e bateria dura muito. Entrega super rápida. Recomendo demais!",        product: "Fone Bluetooth TWS Pro",      ago: "2 dias" },
  { id: "rv-2", customer: "Pedro Oliveira",   rating: 5, comment: "Carregador perfeito para meu notebook e celular ao mesmo tempo. Chegou no dia seguinte. 10/10!",               product: "Carregador Turbo 65W USB-C",  ago: "5 dias" },
  { id: "rv-3", customer: "Juliana Costa",    rating: 4, comment: "Produto exatamente como descrito. Embalagem bem protegida. Único ponto: o cabo poderia ser um pouco mais grosso.", product: "Cabo USB-C 2m Nylon",         ago: "1 semana" },
  { id: "rv-4", customer: "Marcos Silva",     rating: 5, comment: "Mouse silencioso de verdade! Uso no trabalho e ninguém percebe. Ótimo custo-benefício.",                         product: "Mouse Sem Fio Silencioso",    ago: "2 semanas" },
  { id: "rv-5", customer: "Fernanda Santos",  rating: 5, comment: "Power bank salvou minha viagem! Carregou meu celular 5x. Qualidade top e chegou bem embalado.",                 product: "Power Bank 20.000mAh",        ago: "3 semanas" },
  { id: "rv-6", customer: "Lucas Martins",    rating: 4, comment: "Capinha bonita e resistente. Encaixe perfeito no iPhone 15. Só achei o preço um pouquinho salgado.",            product: "Capinha MagSafe iPhone 15",   ago: "1 mês" },
  { id: "rv-7", customer: "Camila Rodrigues", rating: 5, comment: "Comprei já a 3ª vez nessa loja. Sempre entrega rápido e os produtos são ótimos. Loja de confiança!",            product: "Fone Bluetooth TWS Pro",      ago: "1 mês" },
  { id: "rv-8", customer: "Diego Nascimento", rating: 5, comment: "Suporte magnético fixou firme na saída de ar do carro. Fácil de usar e resistente. Super recomendo.",           product: "Suporte Veicular Magnético",  ago: "6 semanas" },
];

// ── Distribuição das avaliações ──────────────────────────
export const DEMO_RATING_DIST = { 5: 89, 4: 28, 3: 7, 2: 2, 1: 1 };

// ── Métricas gerais ───────────────────────────────────────
export const DEMO_METRICS = {
  receitaTotal:    27030.00,
  receitaMes:       6840.00,
  crescimentoMes:     39.0, // % vs mês anterior
  totalPedidos:       232,
  pedidosEntregues:   204,
  emAndamento:          3,
  cancelados:           5,
  clientesAtendidos:  189,
  produtosCadastrados:  8,
  ticketMedio:        116.50,
  taxaRepeticao:       28.0, // % clientes que voltaram
};
