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
import pCadeiraUsada from "@/assets/p-cadeira-usada.jpg";
import pSmartphoneSeminovo from "@/assets/p-smartphone-seminovo.jpg";
import pBicicletaUsada from "@/assets/p-bicicleta-usada.jpg";
import pRoupasInfantisUsadas from "@/assets/p-roupas-infantis-usadas.jpg";
import pMesaMadeiraUsada from "@/assets/p-mesa-madeira-usada.jpg";

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
  // Pessoas físicas / usados
  { id: "p14", sellerId: "u1", name: "Cadeira de escritório usada", price: 180.0, originalPrice: 260.0, description: "Cadeira giratória em bom estado, com regulagem de altura e marcas leves de uso.", category: "usados", image: pCadeiraUsada, onSale: true, popular: true },
  { id: "p15", sellerId: "u2", name: "Smartphone seminovo 128GB", price: 890.0, description: "Aparelho pessoal com carregador, funcionando bem e com pequenos riscos na lateral.", category: "eletronicos", image: pSmartphoneSeminovo, popular: true },
  { id: "p16", sellerId: "u3", name: "Bicicleta aro 29", price: 650.0, originalPrice: 780.0, description: "Bicicleta usada para passeio, revisada recentemente e pronta para retirada.", category: "usados", image: pBicicletaUsada, onSale: true },
  { id: "p17", sellerId: "u1", name: "Lote de roupas infantis", price: 120.0, description: "Peças usadas em ótimo estado, tamanhos variados para criança.", category: "roupas", image: pRoupasInfantisUsadas },
  { id: "p18", sellerId: "u3", name: "Mesa pequena de madeira", price: 95.0, description: "Mesa compacta para cozinha ou área de serviço, retirada com o vendedor.", category: "usados", image: pMesaMadeiraUsada },
];

export const getProductSeller = (product: Product) => {
  if (product.storeId) {
    const store = stores.find((s) => s.id === product.storeId);
    return store ? { type: "store" as const, id: store.id, name: store.name, image: store.image, rating: store.rating, reviews: store.reviews, description: store.description, location: store.distance, responseTime: store.deliveryTime, verified: store.verificationStatus === "verificado", accountInfo: "Loja oficial/comercial" } : null;
  }

  if (product.sellerId) {
    const seller = individualSellers.find((s) => s.id === product.sellerId);
    return seller ? { type: "individual" as const, id: seller.id, name: seller.name, avatar: seller.avatar, rating: seller.rating, reviews: seller.reviews, description: seller.accountInfo, location: seller.city, responseTime: seller.responseTime, verified: false, accountInfo: seller.memberSince } : null;
  }

  return null;
};

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

export type DeliveryProposal = {
  id: string;
  orderId: string;
  storeName: string;
  category: string;
  pickup: string;
  pickupNeighborhood: string;
  dropoff: string;
  dropoffNeighborhood: string;
  /** Distância do entregador até o ponto de coleta (km) */
  distanceKm: number;
  /** Distância total da corrida (coleta → entrega) */
  routeKm: number;
  distance: string;          // legado — string formatada
  earnings: number;
  estimatedTime: string;
  items: number;
  priority?: "alta";
};

export const deliveryProposals: DeliveryProposal[] = [
  {
    id: "d1", orderId: "#1042",
    storeName: "Ferragens Central", category: "🔧",
    pickup: "Rua do Comércio, 88", pickupNeighborhood: "Centro",
    dropoff: "Rua das Flores, 200", dropoffNeighborhood: "Jardim América",
    distanceKm: 1.2, routeKm: 2.8, distance: "2.8 km",
    earnings: 12.5, estimatedTime: "14 min", items: 3,
  },
  {
    id: "d2", orderId: "#1043",
    storeName: "Empório Alvorada", category: "🛒",
    pickup: "Av. Central, 220", pickupNeighborhood: "Alvorada",
    dropoff: "Rua dos Lírios, 12", dropoffNeighborhood: "Vila Nova",
    distanceKm: 1.9, routeKm: 3.5, distance: "3.5 km",
    earnings: 14.0, estimatedTime: "18 min", items: 5,
  },
  {
    id: "d3", orderId: "#1044",
    storeName: "Farmácia São José", category: "💊",
    pickup: "Rua Sete de Setembro, 45", pickupNeighborhood: "Centro",
    dropoff: "Av. Brasil, 1200", dropoffNeighborhood: "Parque Industrial",
    distanceKm: 2.4, routeKm: 4.2, distance: "4.2 km",
    earnings: 10.0, estimatedTime: "22 min", items: 2,
  },
  {
    id: "d4", orderId: "#1045",
    storeName: "Quitanda da Vila", category: "🥦",
    pickup: "Rua das Palmeiras, 9", pickupNeighborhood: "Vila Nova",
    dropoff: "Rua Campos Salles, 300", dropoffNeighborhood: "São Bento",
    distanceKm: 3.2, routeKm: 5.1, distance: "5.1 km",
    earnings: 16.0, estimatedTime: "26 min", items: 8,
  },
  {
    id: "d5", orderId: "#1046",
    storeName: "Eletrônicos Tech", category: "📱",
    pickup: "Shopping Center Norte", pickupNeighborhood: "Bela Vista",
    dropoff: "Condomínio Park, Ap. 42", dropoffNeighborhood: "Jardim Europa",
    distanceKm: 4.6, routeKm: 7.0, distance: "7.0 km",
    earnings: 22.0, estimatedTime: "35 min", items: 1, priority: "alta",
  },
  {
    id: "d6", orderId: "#1047",
    storeName: "Padaria Sabor Real", category: "🍞",
    pickup: "Rua dos Pinheiros, 155", pickupNeighborhood: "Pinheiros",
    dropoff: "Alameda Santos, 800", dropoffNeighborhood: "Bela Vista",
    distanceKm: 0.7, routeKm: 1.8, distance: "1.8 km",
    earnings: 8.0, estimatedTime: "10 min", items: 2,
  },
  {
    id: "d7", orderId: "#1048",
    storeName: "Açougue Nobre", category: "🥩",
    pickup: "Rua Haddock Lobo, 200", pickupNeighborhood: "Cerqueira César",
    dropoff: "Av. Rebouças, 1500", dropoffNeighborhood: "Pinheiros",
    distanceKm: 2.8, routeKm: 4.9, distance: "4.9 km",
    earnings: 15.5, estimatedTime: "28 min", items: 6, priority: "alta",
  },
  {
    id: "d8", orderId: "#1049",
    storeName: "Mercearia Boa Vista", category: "🛒",
    pickup: "Rua Boa Vista, 340", pickupNeighborhood: "Centro",
    dropoff: "Av. São João, 600", dropoffNeighborhood: "República",
    distanceKm: 1.5, routeKm: 2.9, distance: "2.9 km",
    earnings: 11.0, estimatedTime: "15 min", items: 4,
  },
  {
    id: "d9", orderId: "#1050",
    storeName: "Flores & Presentes", category: "🌸",
    pickup: "Rua Augusta, 900", pickupNeighborhood: "Consolação",
    dropoff: "Rua Pamplona, 400", dropoffNeighborhood: "Jardins",
    distanceKm: 6.3, routeKm: 8.4, distance: "8.4 km",
    earnings: 28.0, estimatedTime: "45 min", items: 1,
  },
  {
    id: "d10", orderId: "#1051",
    storeName: "Pet Shop Amigos", category: "🐾",
    pickup: "Av. Paulista, 900", pickupNeighborhood: "Bela Vista",
    dropoff: "Rua Oscar Freire, 500", dropoffNeighborhood: "Jardins",
    distanceKm: 9.1, routeKm: 11.5, distance: "11.5 km",
    earnings: 35.0, estimatedTime: "55 min", items: 3,
  },
  {
    id: "d11", orderId: "#1052",
    storeName: "Papelaria Criativa", category: "📚",
    pickup: "Rua Direita, 50", pickupNeighborhood: "Centro",
    dropoff: "Av. Ipiranga, 200", dropoffNeighborhood: "República",
    distanceKm: 0.9, routeKm: 1.6, distance: "1.6 km",
    earnings: 7.0, estimatedTime: "9 min", items: 5,
  },
  {
    id: "d12", orderId: "#1053",
    storeName: "Loja Construções", category: "🏗️",
    pickup: "Av. do Estado, 1200", pickupNeighborhood: "Brás",
    dropoff: "Rua da Mooca, 800", dropoffNeighborhood: "Mooca",
    distanceKm: 7.8, routeKm: 10.2, distance: "10.2 km",
    earnings: 32.0, estimatedTime: "50 min", items: 12,
  },
];
