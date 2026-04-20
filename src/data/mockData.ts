import storePadaria from "@/assets/store-padaria.jpg";
import storeQuitanda from "@/assets/store-quitanda.jpg";
import storeMercado from "@/assets/store-mercado.jpg";
import storeFlores from "@/assets/store-flores.jpg";

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
};

export type Product = {
  id: string;
  storeId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  emoji: string;
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
  { id: "padaria", name: "Padaria", emoji: "🥐" },
  { id: "mercado", name: "Mercado", emoji: "🛒" },
  { id: "acougue", name: "Açougue", emoji: "🥩" },
  { id: "flores", name: "Flores", emoji: "💐" },
  { id: "farmacia", name: "Farmácia", emoji: "💊" },
  { id: "comida", name: "Comida", emoji: "🍕" },
];

export const stores: Store[] = [
  {
    id: "s1",
    name: "Empório Alvorada",
    category: "mercado",
    rating: 4.8,
    reviews: 124,
    distance: "0.8km",
    deliveryTime: "12min",
    image: storeMercado,
    description: "Mercadinho de bairro com tudo que você precisa no dia a dia.",
    freeShippingFrom: 30,
  },
  {
    id: "s2",
    name: "Quitanda da Vila",
    category: "mercado",
    rating: 4.9,
    reviews: 89,
    distance: "1.2km",
    deliveryTime: "18min",
    image: storeQuitanda,
    description: "Frutas, legumes e verduras fresquinhos direto do produtor.",
  },
  {
    id: "s3",
    name: "Padaria Sabor Real",
    category: "padaria",
    rating: 4.7,
    reviews: 210,
    distance: "0.5km",
    deliveryTime: "10min",
    image: storePadaria,
    description: "Pão quentinho a qualquer hora do dia.",
    freeShippingFrom: 25,
  },
  {
    id: "s4",
    name: "Floricultura Bem-me-quer",
    category: "flores",
    rating: 5.0,
    reviews: 56,
    distance: "2.1km",
    deliveryTime: "25min",
    image: storeFlores,
    description: "Buquês, arranjos e plantas para todas as ocasiões.",
  },
];

export const products: Product[] = [
  // Padaria
  { id: "p1", storeId: "s3", name: "Pão Francês (10un)", price: 8.5, description: "Pão fresquinho assado na hora.", category: "padaria", emoji: "🥖" },
  { id: "p2", storeId: "s3", name: "Croissant de Manteiga", price: 7.9, description: "Folhado crocante de manteiga francesa.", category: "padaria", emoji: "🥐" },
  { id: "p3", storeId: "s3", name: "Bolo de Cenoura c/ Chocolate", price: 24.0, description: "Fatia generosa, cobertura cremosa.", category: "padaria", emoji: "🍰" },
  // Mercado
  { id: "p4", storeId: "s1", name: "Leite Integral 1L", price: 5.49, description: "Leite UHT longa vida.", category: "mercado", emoji: "🥛" },
  { id: "p5", storeId: "s1", name: "Café Torrado 500g", price: 18.9, description: "Café especial torrado e moído.", category: "mercado", emoji: "☕" },
  { id: "p6", storeId: "s1", name: "Açúcar Refinado 1kg", price: 6.2, description: "Açúcar refinado especial.", category: "mercado", emoji: "🍬" },
  // Quitanda
  { id: "p7", storeId: "s2", name: "Banana Prata (kg)", price: 6.99, description: "Banana doce e madura.", category: "mercado", emoji: "🍌" },
  { id: "p8", storeId: "s2", name: "Tomate Italiano (kg)", price: 9.5, description: "Tomate firme para saladas.", category: "mercado", emoji: "🍅" },
  { id: "p9", storeId: "s2", name: "Alface Crespa", price: 4.5, description: "Maço fresco e crocante.", category: "mercado", emoji: "🥬" },
  // Flores
  { id: "p10", storeId: "s4", name: "Buquê Rosas e Margaridas", price: 89.0, description: "Buquê artesanal com 12 rosas e margaridas.", category: "flores", emoji: "💐" },
  { id: "p11", storeId: "s4", name: "Mini Suculenta", price: 22.0, description: "Vasinho decorativo de cerâmica.", category: "flores", emoji: "🪴" },
];

export const initialOrders: Order[] = [
  {
    id: "#1042",
    storeId: "s3",
    storeName: "Padaria Sabor Real",
    items: [
      { productId: "p1", name: "Pão Francês (10un)", quantity: 2, price: 8.5 },
      { productId: "p2", name: "Croissant de Manteiga", quantity: 3, price: 7.9 },
    ],
    total: 40.7,
    status: "preparando",
    customer: "João Souza",
    address: "Rua das Flores, 200",
    createdAt: "há 5 min",
  },
  {
    id: "#1041",
    storeId: "s3",
    storeName: "Padaria Sabor Real",
    items: [{ productId: "p3", name: "Bolo de Cenoura", quantity: 1, price: 24.0 }],
    total: 24.0,
    status: "saiu",
    customer: "Marina Lima",
    address: "Av. Brasil, 1500",
    createdAt: "há 18 min",
  },
  {
    id: "#1040",
    storeId: "s3",
    storeName: "Padaria Sabor Real",
    items: [{ productId: "p1", name: "Pão Francês (10un)", quantity: 1, price: 8.5 }],
    total: 8.5,
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
    storeName: "Padaria Sabor Real",
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
