import storeMercado from "@/assets/store-mercado.jpg";
import storeFlores from "@/assets/store-flores.jpg";
import storeConstrucao from "@/assets/store-construcao.jpg";
import storeFerramentas from "@/assets/store-ferramentas.jpg";
import storeUtilidades from "@/assets/store-utilidades.jpg";
import storeFarmacia from "@/assets/store-farmacia.jpg";
import storePapelaria from "@/assets/store-papelaria.jpg";
import storeEletronicos from "@/assets/store-eletronicos.jpg";
import storeRoupas from "@/assets/store-roupas.jpg";

import pCimento from "@/assets/p-cimento.jpg";
import pMartelo from "@/assets/p-martelo.jpg";
import pFuradeira from "@/assets/p-furadeira.jpg";
import pChave from "@/assets/p-chave.jpg";
import pDetergente from "@/assets/p-detergente.jpg";
import pEscova from "@/assets/p-escova.jpg";
import pLampada from "@/assets/p-lampada.jpg";
import pTomada from "@/assets/p-tomada.jpg";
import pCaderno from "@/assets/p-caderno.jpg";
import pArroz from "@/assets/p-arroz.jpg";
import pCamiseta from "@/assets/p-camiseta.jpg";
import pFlores from "@/assets/p-flores.jpg";
import pRemedio from "@/assets/p-remedio.jpg";

export type Category = {
  id: string;
  name: string;
  emoji: string;
};

export type Store = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  deliveryTime: string;
  image: string;
  description: string;
  freeShippingFrom?: number;
  sellerType: "cnpj" | "empreendedor" | "comum";
  verificationStatus: "nao_verificado" | "pendente" | "verificado" | "rejeitado";
  verificationType?: "cnpj" | "manual";
  cnpj?: string;
};

export type IndividualSeller = {
  id: string;
  name: string;
  avatar: string;
  city: string;
  memberSince: string;
  responseTime: string;
  accountInfo: string;
  rating: number;
  reviews: number;
  verificationStatus: "nao_verificado" | "pendente" | "verificado" | "rejeitado";
};

export type Product = {
  id: string;
  storeId?: string;
  sellerId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  image: string;
  popular?: boolean;
  onSale?: boolean;
};

export type OrderStatus = "confirmado" | "preparando" | "saiu" | "entregue";

export type Order = {
  id: string;
  storeId: string;
  storeName: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  customer: string;
  address: string;
  createdAt: string;
};

export const categories: Category[] = [
  { id: "mercado", name: "Mercado", emoji: "🛒" },
  { id: "construcao", name: "Construção", emoji: "🧱" },
  { id: "limpeza", name: "Limpeza", emoji: "🧴" },
  { id: "ferramentas", name: "Ferramentas", emoji: "🔧" },
  { id: "farmacia", name: "Farmácia", emoji: "💊" },
  { id: "papelaria", name: "Papelaria", emoji: "📒" },
  { id: "flores", name: "Flores", emoji: "💐" },
  { id: "eletronicos", name: "Eletrônicos", emoji: "💡" },
  { id: "roupas", name: "Roupas", emoji: "👕" },
  { id: "usados", name: "Usados", emoji: "♻️" },
];

export const individualSellers: IndividualSeller[] = [
  {
    id: "u1",
    name: "Ana Ribeiro",
    avatar: "AR",
    city: "Centro",
    memberSince: "Conta criada em 2023",
    responseTime: "Responde em até 20 min",
    accountInfo: "Pessoa física vendendo itens próprios usados",
    rating: 4.6,
    reviews: 18,
    verificationStatus: "nao_verificado",
  },
  {
    id: "u2",
    name: "Lucas Martins",
    avatar: "LM",
    city: "Jardim América",
    memberSince: "Conta criada em 2024",
    responseTime: "Responde em até 1h",
    accountInfo: "Vendedor ocasional de eletrônicos e móveis",
    rating: 4.4,
    reviews: 9,
    verificationStatus: "nao_verificado",
  },
  {
    id: "u3",
    name: "Patrícia Gomes",
    avatar: "PG",
    city: "Vila Nova",
    memberSince: "Conta criada em 2022",
    responseTime: "Responde hoje",
    accountInfo: "Anúncios pessoais sem loja formal",
    rating: 4.8,
    reviews: 26,
    verificationStatus: "nao_verificado",
  },
];

export const stores: Store[] = [
  {
    id: "s1",
    name: "Empório Alvorada",
    category: "mercado",
    rating: 4.8,
    reviews: 124,
    distance: "0.8km",
    deliveryTime: "30min",
    image: storeMercado,
    description: "Mercadinho de bairro com tudo que você precisa.",
    freeShippingFrom: 50,
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
    cnpj: "12.345.678/0001-90",
  },
  {
    id: "s2",
    name: "Construfácil Materiais",
    category: "construcao",
    rating: 4.7,
    reviews: 86,
    distance: "1.4km",
    deliveryTime: "1h",
    image: storeConstrucao,
    description: "Cimento, tijolos e materiais para sua obra.",
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
  },
  {
    id: "s3",
    name: "Ferragens do Bairro",
    category: "ferramentas",
    rating: 4.9,
    reviews: 142,
    distance: "0.6km",
    deliveryTime: "45min",
    image: storeFerramentas,
    description: "Ferramentas, parafusos e acessórios para reparos.",
    freeShippingFrom: 80,
    sellerType: "empreendedor",
    verificationStatus: "verificado",
    verificationType: "manual",
  },
  {
    id: "s4",
    name: "Casa & Limpeza",
    category: "limpeza",
    rating: 4.6,
    reviews: 71,
    distance: "1.0km",
    deliveryTime: "40min",
    image: storeUtilidades,
    description: "Produtos de limpeza e utilidades domésticas.",
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
  },
  {
    id: "s5",
    name: "Farmácia Saúde+",
    category: "farmacia",
    rating: 4.9,
    reviews: 312,
    distance: "0.5km",
    deliveryTime: "20min",
    image: storeFarmacia,
    description: "Medicamentos, perfumaria e cuidados pessoais.",
    freeShippingFrom: 40,
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
    cnpj: "98.765.432/0001-10",
  },
  {
    id: "s6",
    name: "Papelaria Criativa",
    category: "papelaria",
    rating: 4.8,
    reviews: 58,
    distance: "1.2km",
    deliveryTime: "50min",
    image: storePapelaria,
    description: "Material escolar, escritório e arte.",
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
  },
  {
    id: "s7",
    name: "EletroLuz",
    category: "eletronicos",
    rating: 4.5,
    reviews: 49,
    distance: "1.8km",
    deliveryTime: "1h",
    image: storeEletronicos,
    description: "Lâmpadas, tomadas e eletrônicos simples.",
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
  },
  {
    id: "s8",
    name: "Floricultura Bem-me-quer",
    category: "flores",
    rating: 5.0,
    reviews: 56,
    distance: "2.1km",
    deliveryTime: "45min",
    image: storeFlores,
    description: "Buquês, arranjos e plantas para todas as ocasiões.",
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
  },
  {
    id: "s9",
    name: "Loja Urbana Style",
    category: "roupas",
    rating: 4.7,
    reviews: 93,
    distance: "1.5km",
    deliveryTime: "1h",
    image: storeRoupas,
    description: "Roupas e acessórios casuais.",
    sellerType: "cnpj",
    verificationStatus: "verificado",
    verificationType: "cnpj",
  },
];

export const verificationRequests = stores
  .filter((store) => store.verificationType === "manual")
  .map((store) => ({
    id: `vr-${store.id}`,
    storeId: store.id,
    storeName: store.name,
    sellerName: store.id === "s2" ? "Rafael Nogueira" : store.id === "s8" ? "Bianca Prado" : "Marina Flores",
    status: store.verificationStatus,
    submittedAt: store.verificationStatus === "pendente" ? "Hoje" : "há 3 dias",
    proofs: ["Vídeo dos produtos ou estoque", "Histórico de vendas", "Redes sociais comerciais"],
  }));

export const products: Product[] = [
  // Construção
  { id: "p1", storeId: "s2", name: "Cimento CP-II 50kg", price: 39.9, originalPrice: 49.9, description: "Saco de cimento Portland CP-II, ideal para alvenaria e estruturas.", category: "construcao", image: pCimento, onSale: true, popular: true },
  // Ferramentas
  { id: "p2", storeId: "s3", name: "Martelo de Unha 27mm", price: 34.5, description: "Martelo de aço com cabo emborrachado antiderrapante.", category: "ferramentas", image: pMartelo, popular: true },
  { id: "p3", storeId: "s3", name: "Furadeira de Impacto 600W", price: 289.0, originalPrice: 349.0, description: "Furadeira sem fio com bateria recarregável e maleta.", category: "ferramentas", image: pFuradeira, onSale: true },
  { id: "p4", storeId: "s3", name: "Chave de Boca Ajustável 8\"", price: 42.9, description: "Chave inglesa em aço cromado, abertura ajustável.", category: "ferramentas", image: pChave },
  // Limpeza
  { id: "p5", storeId: "s4", name: "Detergente Líquido 500ml", price: 3.49, description: "Detergente neutro para louças, alta concentração.", category: "limpeza", image: pDetergente, popular: true },
  { id: "p6", storeId: "s4", name: "Escova Multiuso", price: 9.9, originalPrice: 14.9, description: "Escova com cerdas resistentes para limpeza pesada.", category: "limpeza", image: pEscova, onSale: true },
  // Eletrônicos
  { id: "p7", storeId: "s7", name: "Lâmpada LED 9W Branca", price: 12.9, description: "Lâmpada LED econômica, soquete E27, 6500K.", category: "eletronicos", image: pLampada, popular: true },
  { id: "p8", storeId: "s7", name: "Tomada 2P+T 10A", price: 14.5, description: "Tomada de embutir branca, padrão brasileiro.", category: "eletronicos", image: pTomada },
  // Papelaria
  { id: "p9", storeId: "s6", name: "Caderno Universitário 200fls", price: 24.9, originalPrice: 32.0, description: "Caderno espiral 10 matérias, capa dura.", category: "papelaria", image: pCaderno, onSale: true },
  // Mercado
  { id: "p10", storeId: "s1", name: "Arroz Branco Tipo 1 — 5kg", price: 28.9, description: "Pacote de arroz branco selecionado, grãos longos.", category: "mercado", image: pArroz, popular: true },
  // Roupas
  { id: "p11", storeId: "s9", name: "Camiseta Básica Algodão", price: 49.9, originalPrice: 69.9, description: "Camiseta unissex 100% algodão, vários tamanhos.", category: "roupas", image: pCamiseta, onSale: true, popular: true },
  // Flores
  { id: "p12", storeId: "s8", name: "Buquê de Rosas Mistas", price: 89.0, description: "Buquê artesanal com 12 rosas em embalagem kraft.", category: "flores", image: pFlores },
  // Farmácia
  { id: "p13", storeId: "s5", name: "Paracetamol 500mg c/ 20", price: 8.9, description: "Analgésico e antitérmico, caixa com 20 comprimidos.", category: "farmacia", image: pRemedio, popular: true },
];

export const initialOrders: Order[] = [
  {
    id: "#1042",
    storeId: "s3",
    storeName: "Ferragens do Bairro",
    items: [
      { productId: "p2", name: "Martelo de Unha 27mm", quantity: 1, price: 34.5 },
      { productId: "p4", name: "Chave de Boca Ajustável 8\"", quantity: 1, price: 42.9 },
    ],
    total: 77.4,
    status: "preparando",
    customer: "João Souza",
    address: "Rua das Flores, 200",
    createdAt: "há 5 min",
  },
  {
    id: "#1041",
    storeId: "s3",
    storeName: "Ferragens do Bairro",
    items: [{ productId: "p3", name: "Furadeira de Impacto 600W", quantity: 1, price: 289.0 }],
    total: 289.0,
    status: "saiu",
    customer: "Marina Lima",
    address: "Av. Brasil, 1500",
    createdAt: "há 18 min",
  },
  {
    id: "#1040",
    storeId: "s3",
    storeName: "Ferragens do Bairro",
    items: [{ productId: "p2", name: "Martelo de Unha 27mm", quantity: 2, price: 34.5 }],
    total: 69.0,
    status: "entregue",
    customer: "Pedro Alves",
    address: "Rua Verde, 45",
    createdAt: "há 1h",
  },
];

export const deliveryProposals = [
  {
    id: "d1",
    orderId: "#1042",
    storeName: "Ferragens do Bairro",
    pickup: "Rua do Comércio, 88 — Centro",
    dropoff: "Rua das Flores, 200",
    distance: "2.4 km",
    earnings: 12.5,
    estimatedTime: "15 min",
  },
  {
    id: "d2",
    orderId: "#1043",
    storeName: "Empório Alvorada",
    pickup: "Av. Central, 220",
    dropoff: "Rua dos Lírios, 12",
    distance: "3.1 km",
    earnings: 14.0,
    estimatedTime: "20 min",
  },
];
