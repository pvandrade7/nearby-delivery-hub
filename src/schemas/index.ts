import { z } from "zod";

// ─────────────────────────────────────────────────────────
// Utilitário: extrai a primeira mensagem de erro de um ZodError
// ─────────────────────────────────────────────────────────
export const firstError = (err: z.ZodError): string =>
  err.issues[0]?.message ?? "Dados inválidos.";

// ─────────────────────────────────────────────────────────
// Loja (CreateStore / MyStore)
// ─────────────────────────────────────────────────────────
export const storeSchema = z.object({
  name:        z.string().min(3,  "O nome da loja deve ter pelo menos 3 caracteres.")
                          .max(80, "Nome muito longo (máx. 80 caracteres)."),
  description: z.string().max(400, "Descrição muito longa (máx. 400 caracteres).").optional(),
  category:    z.string().min(1, "Selecione uma categoria para a loja."),
});

export type StoreFormValues = z.infer<typeof storeSchema>;

// ─────────────────────────────────────────────────────────
// Produto (NewProduct)
// ─────────────────────────────────────────────────────────
const priceString = z
  .string()
  .min(1, "Informe o preço do produto.")
  .refine(
    (v) => {
      const n = parseFloat(v.replace(",", ".").replace(/[^0-9.]/g, ""));
      return !isNaN(n) && n > 0;
    },
    { message: "Informe um preço válido e maior que zero." }
  )
  .refine(
    (v) => {
      const n = parseFloat(v.replace(",", ".").replace(/[^0-9.]/g, ""));
      return n <= 999_999;
    },
    { message: "Preço não pode exceder R$ 999.999." }
  );

export const productSchema = z.object({
  name:        z.string().min(2,   "O nome deve ter pelo menos 2 caracteres.")
                          .max(120, "Nome muito longo (máx. 120 caracteres)."),
  priceStr:    priceString,
  description: z.string().min(1,   "Adicione uma descrição ao produto.")
                          .max(600, "Descrição muito longa (máx. 600 caracteres)."),
  category:    z.string().min(1,   "Selecione uma categoria para o produto."),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// ─────────────────────────────────────────────────────────
// Checkout — endereço de entrega
// ─────────────────────────────────────────────────────────
export const deliveryAddressSchema = z.object({
  address: z.string()
    .min(5,   "Informe o endereço completo de entrega.")
    .max(300, "Endereço muito longo."),
});

export type DeliveryAddressValues = z.infer<typeof deliveryAddressSchema>;

// ─────────────────────────────────────────────────────────
// Chamado de suporte (Help)
// ─────────────────────────────────────────────────────────
const TICKET_CATEGORIES = [
  "pedidos", "pagamentos", "entregas", "conta",
  "denuncia", "sugestao", "duvida", "verificacao",
] as const;

export const ticketSchema = z.object({
  subject:  z.string().min(5,   "O assunto deve ter pelo menos 5 caracteres.")
                       .max(200, "Assunto muito longo (máx. 200 caracteres)."),
  message:  z.string().min(10,  "A mensagem deve ter pelo menos 10 caracteres.")
                       .max(2000,"Mensagem muito longa (máx. 2000 caracteres)."),
  category: z.enum(TICKET_CATEGORIES, { message: "Selecione uma categoria válida." }),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

// ─────────────────────────────────────────────────────────
// Verificação manual de lojista (SellerVerification)
// ─────────────────────────────────────────────────────────
export const manualVerificationSchema = z.object({
  store_name:        z.string().min(2,  "Informe o nome da loja.")
                                .max(120, "Nome muito longo."),
  store_description: z.string().min(10, "Descrição muito curta — detalhe mais sua atividade.")
                                .max(1000, "Descrição muito longa."),
  store_category:    z.string().min(1,  "Selecione a categoria da loja."),
  no_cnpj_reason:    z.string().min(10, "Explique com mais detalhes por que não possui CNPJ.")
                                .max(500, "Texto muito longo."),
});

export type ManualVerificationValues = z.infer<typeof manualVerificationSchema>;

// ─────────────────────────────────────────────────────────
// CNPJ (validate-cnpj Edge Function — reutilizável no cliente)
// ─────────────────────────────────────────────────────────
export const cnpjRequestSchema = z.object({
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório.")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 14, { message: "CNPJ deve ter 14 dígitos." }),
});

export type CnpjRequestValues = z.infer<typeof cnpjRequestSchema>;
