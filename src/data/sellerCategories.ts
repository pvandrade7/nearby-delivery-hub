/**
 * Lista canônica de categorias de estabelecimentos do Vendy+.
 * Usada em SellerLogin (chips de cadastro), CreateStore e NewProduct.
 * Sem categorias de alimentos — a plataforma não opera com produtos alimentícios.
 */
export const SELLER_CATEGORIES = [
  "Eletrônicos",
  "Assistência Técnica",
  "Celulares e Acessórios",
  "Informática",
  "Games",
  "Moda e Vestuário",
  "Cosméticos",
  "Papelaria",
  "Livraria",
  "Utilidades Domésticas",
  "Presentes",
  "Joalheria",
  "Esportes",
  "Pet Shop",
  "Construção e Ferragens",
  "Móveis e Decoração",
  "Serviços",
  "Outros",
] as const;

export type SellerCategory = (typeof SELLER_CATEGORIES)[number];
