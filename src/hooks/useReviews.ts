import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseId } from "@/hooks/useStores";
import { toast } from "sonner";

// ── Tipo unificado de review ──────────────────────────────────────────────────

export type ReviewItem = {
  id:           string;
  buyerName:    string;
  buyerInitial: string;
  rating:       number;
  comment:      string;
  createdAt:    string;
};

// ── Dados brutos para mock ────────────────────────────────────────────────────

type RawReview = { name: string; rating: number; comment: string; ago: string };

const toMockItem = (r: RawReview, idx: number, storeId: string): ReviewItem => ({
  id:           `mr-${storeId}-${idx}`,
  buyerName:    r.name,
  buyerInitial: r.name[0].toUpperCase(),
  rating:       r.rating,
  comment:      r.comment,
  createdAt:    r.ago,
});

// ── Pools de reviews por categoria ───────────────────────────────────────────

const POOL_ELETRONICOS: RawReview[] = [
  { name: "Rafael Lima",     rating: 5, comment: "Produto original e entrega super rápida. Muito satisfeito!", ago: "há 2 dias" },
  { name: "Camila Torres",   rating: 5, comment: "Celular chegou lacrado, funcionando perfeitamente. Confiança total!", ago: "há 5 dias" },
  { name: "Felipe Souza",    rating: 4, comment: "Bom atendimento, produto conforme descrito. Recomendo.", ago: "há 1 semana" },
  { name: "Larissa Costa",   rating: 5, comment: "Terceira vez que compro aqui! Sempre tudo certo e dentro do prazo.", ago: "há 2 semanas" },
  { name: "Diego Martins",   rating: 3, comment: "Produto bom, mas demorou um pouco mais que o esperado para chegar.", ago: "há 3 semanas" },
  { name: "Natalia Freitas", rating: 5, comment: "Melhor loja de eletrônicos da cidade! Suporte pós-venda excelente.", ago: "há 1 mês" },
  { name: "Bruno Nunes",     rating: 4, comment: "Ótima relação custo-benefício. Voltarei a comprar com certeza!", ago: "há 1 mês" },
  { name: "Priscila Mendes", rating: 5, comment: "Assistência técnica rápida e profissional. Resolveu em 1 dia!", ago: "há 6 semanas" },
];

const POOL_FARMACIA: RawReview[] = [
  { name: "Sandra Oliveira", rating: 5, comment: "Medicamentos chegaram bem embalados e no prazo combinado.", ago: "há 1 dia" },
  { name: "Paulo Barbosa",   rating: 5, comment: "Ótimo serviço! Entrega rápida e profissional.", ago: "há 4 dias" },
  { name: "Renata Gomes",    rating: 4, comment: "Bom atendimento e preços competitivos. Recomendo!", ago: "há 1 semana" },
  { name: "Eduardo Silva",   rating: 5, comment: "Sempre compro aqui. Confiável e pontual nas entregas.", ago: "há 10 dias" },
  { name: "Marina Pereira",  rating: 3, comment: "Produto ok, mas o prazo foi um pouco maior que o previsto.", ago: "há 2 semanas" },
  { name: "Thiago Alves",    rating: 5, comment: "Farmácia excelente! Preços ótimos e entrega rápida.", ago: "há 3 semanas" },
  { name: "Claudia Reis",    rating: 4, comment: "Atendimento muito bom. Medicamentos com procedência garantida.", ago: "há 1 mês" },
  { name: "Roberto Farias",  rating: 5, comment: "Entregaram genérico de qualidade. Preço justo e atendimento gentil.", ago: "há 6 semanas" },
];

const POOL_MODA: RawReview[] = [
  { name: "Beatriz Santos",   rating: 5, comment: "Roupa linda e qualidade incrível! Chegou dentro do prazo.", ago: "há 2 dias" },
  { name: "Gabriel Ramos",    rating: 4, comment: "Boa qualidade e embalagem muito bonita. Recomendo!", ago: "há 1 semana" },
  { name: "Juliana Lima",     rating: 5, comment: "Já é a quarta compra e nunca me decepcionou. Top!", ago: "há 2 semanas" },
  { name: "Ricardo Ferreira", rating: 3, comment: "Produto conforme foto, mas a cor ficou levemente diferente.", ago: "há 3 semanas" },
  { name: "Isabela Costa",    rating: 5, comment: "Tecido de ótima qualidade e caimento perfeito!", ago: "há 1 mês" },
  { name: "Marcos Carvalho",  rating: 5, comment: "Atendimento nota 10. Produto idêntico ao da foto.", ago: "há 1 mês" },
  { name: "Amanda Oliveira",  rating: 4, comment: "Gostei muito! Entrega rápida e produto conforme descrito.", ago: "há 6 semanas" },
  { name: "Fernanda Lima",    rating: 5, comment: "Coleção linda! Vou indicar para todas as minhas amigas.", ago: "há 2 meses" },
];

const POOL_CONSTRUCAO: RawReview[] = [
  { name: "Carlos Andrade",    rating: 5, comment: "Material de primeira qualidade. Entrega rápida mesmo sendo produto pesado.", ago: "há 3 dias" },
  { name: "Sandro Costa",      rating: 4, comment: "Bom produto e atendimento. Preço competitivo com o mercado.", ago: "há 1 semana" },
  { name: "José Nascimento",   rating: 5, comment: "Ferramentas resistentes e de qualidade profissional!", ago: "há 2 semanas" },
  { name: "Paulo Santos",      rating: 3, comment: "Produto ok, mas a embalagem chegou amassada. Conteúdo intacto.", ago: "há 3 semanas" },
  { name: "Marcos Lima",       rating: 5, comment: "Comprei tinta e ficou exatamente como a cor da carta. Excelente!", ago: "há 1 mês" },
  { name: "Alexandre Vieira",  rating: 4, comment: "Bom atendimento. Voltarei quando precisar de mais material.", ago: "há 1 mês" },
  { name: "Roberto Fonseca",   rating: 5, comment: "Loja confiável! Entregam no prazo e produto de qualidade.", ago: "há 6 semanas" },
  { name: "Cleiton Moraes",    rating: 4, comment: "Variedade boa e vendedores bem informados. Recomendo!", ago: "há 2 meses" },
];

const POOL_PETSHOP: RawReview[] = [
  { name: "Giovanna Lima",   rating: 5, comment: "Ração chegou rapidinho! Meu pet adorou. Voltarei a comprar.", ago: "há 1 dia" },
  { name: "Caio Rodrigues",  rating: 5, comment: "Atendimento incrível e produto de qualidade. Recomendo muito!", ago: "há 4 dias" },
  { name: "Leticia Sousa",   rating: 4, comment: "Bom atendimento e preço justo. Minha cachorrinha aprovou!", ago: "há 1 semana" },
  { name: "Henrique Campos", rating: 5, comment: "Serviço de banho e tosa impecável. Ficou lindo e cheiroso!", ago: "há 2 semanas" },
  { name: "Patricia Rocha",  rating: 3, comment: "Produto ok mas poderia ter mais opções de tamanho.", ago: "há 3 semanas" },
  { name: "Luisa Ferreira",  rating: 5, comment: "Melhor pet shop do bairro! Funcionários muito atenciosos.", ago: "há 1 mês" },
  { name: "Anderson Costa",  rating: 5, comment: "Entregam rápido e o produto chegou bem embalado. Show!", ago: "há 6 semanas" },
  { name: "Simone Alves",    rating: 4, comment: "Consultei sobre dieta do meu gato e fui super bem atendida.", ago: "há 2 meses" },
];

const POOL_COSMETICOS: RawReview[] = [
  { name: "Aline Barbosa",  rating: 5, comment: "Perfume incrível! Idêntico ao original e dura o dia todo.", ago: "há 2 dias" },
  { name: "Victor Hugo",    rating: 5, comment: "Produto original e preço ótimo. Recomendo muito!", ago: "há 5 dias" },
  { name: "Bianca Martins", rating: 4, comment: "Hidratante maravilhoso! Pele ficou super macia.", ago: "há 1 semana" },
  { name: "Rodrigo Lima",   rating: 5, comment: "Atendimento nota 10 e maquiagem de qualidade excelente.", ago: "há 2 semanas" },
  { name: "Natasha Costa",  rating: 4, comment: "Produto autêntico e entrega dentro do prazo. Recomendo!", ago: "há 3 semanas" },
  { name: "Filipe Sousa",   rating: 5, comment: "Presentes lindos! Embalagem caprichada e produto de qualidade.", ago: "há 1 mês" },
  { name: "Monique Dias",   rating: 3, comment: "Produto ok, mas demorou um pouco mais que o esperado.", ago: "há 6 semanas" },
  { name: "Tatiana Ramos",  rating: 5, comment: "Shampoo profissional com preço acessível. Cabelo ficou lindo!", ago: "há 2 meses" },
];

const POOL_AUTOPECAS: RawReview[] = [
  { name: "Marcelo Silva",   rating: 5, comment: "Peça original e entrega super rápida. Voltarei a comprar!", ago: "há 2 dias" },
  { name: "Jorge Oliveira",  rating: 4, comment: "Produto de qualidade e preço competitivo. Recomendo.", ago: "há 1 semana" },
  { name: "Flavio Costa",    rating: 5, comment: "Atendimento excelente e peça encaixou perfeitamente no carro.", ago: "há 2 semanas" },
  { name: "Renato Alves",    rating: 3, comment: "Produto ok, mas preço poderia ser melhor comparado a outras lojas.", ago: "há 3 semanas" },
  { name: "Kleber Lima",     rating: 5, comment: "Serviço de qualidade! Diagnóstico gratuito e muito honesto.", ago: "há 1 mês" },
  { name: "Cesar Santos",    rating: 4, comment: "Boa loja! Comprei óleo e filtro com bom preço e qualidade.", ago: "há 6 semanas" },
  { name: "Wanderson Neto",  rating: 5, comment: "Atendimento técnico impecável. Resolveram o problema rapidinho.", ago: "há 2 meses" },
];

const POOL_PAPELARIA: RawReview[] = [
  { name: "Tiago Moreira",    rating: 5, comment: "Material escolar de qualidade! Entrega rápida e bem embalado.", ago: "há 3 dias" },
  { name: "Vanessa Lima",     rating: 4, comment: "Boa variedade e atendimento cordial. Recomendo!", ago: "há 1 semana" },
  { name: "Adriano Costa",    rating: 5, comment: "Impressão profissional e prazo cumprido. Excelente!", ago: "há 2 semanas" },
  { name: "Renata Oliveira",  rating: 4, comment: "Ótimos produtos para escritório. Voltarei a comprar.", ago: "há 3 semanas" },
  { name: "Felipe Santos",    rating: 5, comment: "Encadernação perfeita e rápida. Super recomendo!", ago: "há 1 mês" },
  { name: "Cintia Rocha",     rating: 3, comment: "Produto ok, mas demorou um pouco para ficar pronto.", ago: "há 6 semanas" },
  { name: "Augusto Leal",     rating: 5, comment: "Comprei material para o escritório inteiro. Preço ótimo!", ago: "há 2 meses" },
];

const POOL_MOVEIS: RawReview[] = [
  { name: "Leandro Souza",    rating: 5, comment: "Móvel chegou bem embalado, montagem fácil e encaixe perfeito!", ago: "há 3 dias" },
  { name: "Simone Gomes",     rating: 4, comment: "Boa qualidade e preço justo. Entrega no prazo combinado.", ago: "há 1 semana" },
  { name: "Roberto Lima",     rating: 5, comment: "Sofá lindo! Material de qualidade e conforto excelente.", ago: "há 2 semanas" },
  { name: "Claudiana Silva",  rating: 4, comment: "Produto conforme foto. Entrega e montagem inclusos. Ótimo!", ago: "há 3 semanas" },
  { name: "Douglas Costa",    rating: 3, comment: "Produto ok, mas a entrega demorou mais que o informado.", ago: "há 1 mês" },
  { name: "Fabiana Martins",  rating: 5, comment: "Comprei o jogo completo de quarto. Ficou lindo! Recomendo!", ago: "há 6 semanas" },
  { name: "Edson Carvalho",   rating: 5, comment: "Preço de fábrica e qualidade premium. Valeu demais!", ago: "há 2 meses" },
];

const POOL_UTILIDADES: RawReview[] = [
  { name: "Marta Pereira",   rating: 5, comment: "Produtos de qualidade a preço acessível. Super recomendo!", ago: "há 2 dias" },
  { name: "Helio Santos",    rating: 4, comment: "Boa variedade e atendimento cordial. Voltarei a comprar.", ago: "há 1 semana" },
  { name: "Edna Costa",      rating: 5, comment: "Achei tudo que precisava para a casa. Excelente loja!", ago: "há 2 semanas" },
  { name: "Wagner Lima",     rating: 4, comment: "Bom custo-benefício. Produtos funcionando perfeitamente.", ago: "há 3 semanas" },
  { name: "Nelma Rocha",     rating: 3, comment: "Produto ok, mas poderia ter mais variedade de cores.", ago: "há 1 mês" },
  { name: "Davi Ferreira",   rating: 5, comment: "Entrega rápida e produto conforme anunciado. Recomendo!", ago: "há 6 semanas" },
  { name: "Solange Mota",    rating: 5, comment: "Melhor custo-benefício da região. Compro sempre aqui!", ago: "há 2 meses" },
];

const POOL_DEFAULT: RawReview[] = [
  { name: "Ana Paula S.",    rating: 5, comment: "Produto excelente! Chegou rápido e bem embalado. Super recomendo!", ago: "há 2 dias"   },
  { name: "Carlos Melo",     rating: 4, comment: "Bom atendimento e produto de qualidade. Voltarei a comprar.", ago: "há 1 semana" },
  { name: "Fernanda Costa",  rating: 5, comment: "Amei! Superou minhas expectativas. Chegou antes do prazo.", ago: "há 2 semanas" },
  { name: "João Victor L.",  rating: 3, comment: "Produto ok, mas a entrega demorou um pouco mais que o esperado.", ago: "há 3 semanas" },
  { name: "Mariana C.",      rating: 5, comment: "Terceira vez que compro aqui! Sempre confiável e de qualidade.", ago: "há 1 mês"   },
  { name: "Lucas Almeida",   rating: 4, comment: "Muito bom! Preço justo e qualidade garantida. Recomendo!", ago: "há 1 mês"   },
  { name: "Patrícia R.",     rating: 5, comment: "Perfeito! Embalagem impecável e produto dentro do prazo.", ago: "há 6 semanas" },
  { name: "Sandro Viana",    rating: 4, comment: "Atendimento prestativo e entrega dentro do prazo.", ago: "há 2 meses" },
];

const CATEGORY_POOLS: Record<string, RawReview[]> = {
  eletronicos: POOL_ELETRONICOS,
  farmacia:    POOL_FARMACIA,
  moda:        POOL_MODA,
  construcao:  POOL_CONSTRUCAO,
  ferramentas: POOL_CONSTRUCAO,
  petshop:     POOL_PETSHOP,
  cosmeticos:  POOL_COSMETICOS,
  autopecas:   POOL_AUTOPECAS,
  papelaria:   POOL_PAPELARIA,
  moveis:      POOL_MOVEIS,
  utilidades:  POOL_UTILIDADES,
};

/** Retorna reviews fictícias coerentes com a categoria da loja. */
export const getMockReviews = (storeId: string, category?: string): ReviewItem[] => {
  const pool = (category ? CATEGORY_POOLS[category] : null) ?? POOL_DEFAULT;
  return pool.map((r, i) => toMockItem(r, i, storeId));
};

/** Reviews fictícias genéricas (compatibilidade com código legado). */
export const MOCK_REVIEWS: ReviewItem[] = POOL_DEFAULT.map((r, i) =>
  toMockItem(r, i, "mock")
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const toItem = (r: {
  id: string; buyer_name: string; rating: number;
  comment: string | null; created_at: string;
}): ReviewItem => ({
  id:           r.id,
  buyerName:    r.buyer_name || "Cliente",
  buyerInitial: (r.buyer_name || "C")[0].toUpperCase(),
  rating:       r.rating,
  comment:      r.comment || "",
  createdAt:    new Date(r.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  }),
});

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Lista de reviews para uma loja — mock ou real. */
export const useReviews = (storeId: string | undefined, category?: string) => {
  const { isDemo } = useAuth();
  const isMock = !storeId || !isSupabaseId(storeId);

  return useQuery<ReviewItem[]>({
    queryKey: ["reviews", storeId],
    queryFn:  async () => {
      if (isMock || isDemo) return getMockReviews(storeId || "", category);

      const { data, error } = await supabase
        .from("reviews")
        .select("id, buyer_name, rating, comment, created_at")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []).map(toItem);
    },
    enabled:   Boolean(storeId),
    staleTime: 60_000,
  });
};

/** Review que o usuário atual já enviou para esta loja (null se nenhuma). */
export const useUserReview = (storeId: string | undefined) => {
  const { user, isDemo } = useAuth();
  const isMock = !storeId || !isSupabaseId(storeId);

  return useQuery<ReviewItem | null>({
    queryKey: ["user-review", storeId, user?.id],
    queryFn:  async () => {
      if (!user || isMock || isDemo) return null;
      const { data } = await supabase
        .from("reviews")
        .select("id, buyer_name, rating, comment, created_at")
        .eq("store_id", storeId!)
        .eq("buyer_id", user.id)
        .maybeSingle();
      return data ? toItem(data) : null;
    },
    enabled: Boolean(storeId) && Boolean(user) && !isMock && !isDemo,
  });
};

/** Envia ou atualiza a avaliação do usuário para uma loja. */
export const useSubmitReview = (storeId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user) throw new Error("Faça login para avaliar");
      const { error } = await supabase.from("reviews").upsert(
        {
          store_id:   storeId,
          buyer_id:   user.id,
          buyer_name: user.email?.split("@")[0] || "Cliente",
          rating,
          comment:    comment.trim(),
        },
        { onConflict: "store_id,buyer_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reviews",     storeId] });
      void qc.invalidateQueries({ queryKey: ["user-review", storeId, user?.id] });
      void qc.invalidateQueries({ queryKey: ["client-stores"] });
      toast.success("Avaliação enviada! Obrigado pelo feedback.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação.");
    },
  });
};

/** Agrega distribuição e média a partir de um array de reviews. */
export const aggregateReviews = (reviews: ReviewItem[]) => {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of reviews) { dist[r.rating] = (dist[r.rating] ?? 0) + 1; total += r.rating; }
  const avg = reviews.length > 0 ? total / reviews.length : 0;
  return { dist, avg: Math.round(avg * 10) / 10, count: reviews.length };
};
