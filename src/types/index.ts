// Tipos centrais da plataforma Vendy+.
// Importados por componentes, hooks e contextos — nunca por arquivos de dados.

export type Category = { id: string; name: string; emoji: string };

/** Porte do produto — determina o modal de entrega possível. */
export type PorteProduto = "P" | "M" | "G" | "GG";

/** Como o produto pode ser entregue. */
export type TipoEntrega =
  | "motoboy"   // moto ou carro parceiro
  | "carro"     // apenas carro parceiro
  | "loja"      // entrega especializada da loja
  | "retirada"  // apenas retirada no local
  | "combinado" // acordar com o vendedor
  | "servico";  // cliente leva o item à loja

export type Logistica = {
  peso:         number;                    // kg (0 = serviço)
  dims:         [number, number, number];  // [altura, largura, comprimento] cm
  porte:        PorteProduto;
  temEmbalagem: boolean;
  entrega:      TipoEntrega;
  prazo?:       string;
  taxa?:        number;                    // R$ (0 = grátis; undefined = a definir)
};

export type Store = {
  id:                 string;
  name:               string;
  category:           string;
  city:               string;
  rating:             number;
  reviews:            number;
  distance:           string;
  deliveryTime:       string;
  image:              string;
  description:        string;
  freeShippingFrom?:  number;
  sellerType:         "cnpj" | "empreendedor" | "comum";
  verificationStatus: "nao_verificado" | "pendente" | "verificado" | "rejeitado";
  verificationType?:  "cnpj" | "manual";
  cnpj?:              string;
  address?:           string;
  isLocal?:           boolean;
  logo?:              string;
  brandColor?:        string;
};

export type IndividualSeller = {
  id:                 string;
  name:               string;
  avatar:             string;
  city:               string;
  memberSince:        string;
  responseTime:       string;
  accountInfo:        string;
  rating:             number;
  reviews:            number;
  verificationStatus: "nao_verificado" | "pendente" | "verificado" | "rejeitado";
};

export type Product = {
  id:             string;
  storeId?:       string;
  sellerId?:      string;
  name:           string;
  price:          number;
  originalPrice?: number;
  description:    string;
  category:       string;
  image:          string;
  popular?:       boolean;
  onSale?:        boolean;
  logistica?:     Logistica;
};

export type OrderStatus = "confirmado" | "preparando" | "saiu" | "entregue";

export type Order = {
  id:        string;
  storeId:   string;
  storeName: string;
  items:     { productId: string; name: string; quantity: number; price: number }[];
  total:     number;
  status:    OrderStatus;
  customer:  string;
  address:   string;
  createdAt: string;
};
