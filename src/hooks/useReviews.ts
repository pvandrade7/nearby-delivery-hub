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

// ── Reviews fictícias para lojas do mockData ──────────────────────────────────

export const MOCK_REVIEWS: ReviewItem[] = [
  { id: "mr1", buyerName: "Ana Paula S.",    buyerInitial: "A", rating: 5, comment: "Produto excelente! Chegou rápido e bem embalado. Super recomendo para todos!", createdAt: "há 2 dias"   },
  { id: "mr2", buyerName: "Carlos Melo",     buyerInitial: "C", rating: 4, comment: "Bom atendimento e produto de qualidade. Com certeza voltarei a comprar.",       createdAt: "há 1 semana" },
  { id: "mr3", buyerName: "Fernanda Costa",  buyerInitial: "F", rating: 5, comment: "Amei! Superou minhas expectativas. Chegou antes do prazo estimado.",             createdAt: "há 2 semanas"},
  { id: "mr4", buyerName: "João Victor L.",  buyerInitial: "J", rating: 3, comment: "Produto ok, mas a entrega demorou um pouco mais que o esperado.",                createdAt: "há 3 semanas"},
  { id: "mr5", buyerName: "Mariana C.",      buyerInitial: "M", rating: 5, comment: "Terceira vez que compro aqui! Sempre confiável, rápido e de qualidade.",         createdAt: "há 1 mês"   },
  { id: "mr6", buyerName: "Lucas Almeida",   buyerInitial: "L", rating: 4, comment: "Muito bom! Preço justo e qualidade garantida. Recomendo para todos!",            createdAt: "há 1 mês"   },
  { id: "mr7", buyerName: "Patrícia R.",     buyerInitial: "P", rating: 5, comment: "Perfeito! Embalagem impecável e produto dentro do prazo combinado.",              createdAt: "há 6 semanas"},
];

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
export const useReviews = (storeId: string | undefined) => {
  const { isDemo } = useAuth();
  const isMock = !storeId || !isSupabaseId(storeId);

  return useQuery<ReviewItem[]>({
    queryKey: ["reviews", storeId],
    queryFn:  async () => {
      if (isMock || isDemo) return MOCK_REVIEWS;

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
