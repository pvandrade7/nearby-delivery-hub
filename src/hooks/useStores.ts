/**
 * useStores — fonte unificada de lojas para o lado cliente.
 *
 * Estratégia de persistência:
 *  • placeholderData (não initialData): mockData é exibido enquanto o Supabase
 *    carrega, mas NÃO é armazenado no cache. Assim o cache só guarda dados reais,
 *    eliminando a inconsistência onde lojas reais desapareciam após navegar.
 *  • staleTime de 2 min: refetch em background, sem flash no carregamento.
 *  • Ratings agregados: busca reviews no mesmo queryFn e inclui nota/contagem.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stores as MOCK_STORES, categories as MOCK_CATEGORIES } from "@/data/mockData";

export type MockStore = (typeof MOCK_STORES)[number];

// ── Transform helpers ─────────────────────────────────────────────────────────

type RatingMap = Record<string, { total: number; count: number }>;

export const profileToStore = (
  profile: { id: string; extras: unknown; verified: boolean | null; cnpj: string | null },
  ratingMap: RatingMap = {}
): MockStore => {
  const e = (profile.extras as Record<string, string>) ?? {};

  // Converte nome completo da categoria → ID curto do mockData
  const rawCat  = e.storeCategory || e.category || "Outros";
  const catMatch = MOCK_CATEGORIES.find(
    (c) => c.name.toLowerCase() === rawCat.toLowerCase() || c.id === rawCat
  );
  const categoryId = catMatch?.id ?? rawCat;

  // Rating agregado das reviews reais
  const r       = ratingMap[profile.id];
  const rating  = r && r.count > 0 ? Math.round((r.total / r.count) * 10) / 10 : 0;
  const reviews = r?.count ?? 0;

  return {
    id:                 profile.id,
    name:               e.storeName        || "Loja",
    category:           categoryId,
    city:               e.storeCity        || "Fortaleza",
    rating,
    reviews,
    distance:           "—",
    deliveryTime:       "A combinar",
    image:              e.storeBanner      || e.storeLogo  || e.storeImage || "",
    description:        e.storeDescription || "",
    sellerType:         profile.cnpj ? "cnpj" : "empreendedor",
    verificationStatus: profile.verified   ? "verificado"  : "nao_verificado",
    verificationType:   profile.verified
      ? (profile.cnpj ? "cnpj" : "manual")
      : undefined,
    isLocal:            true,
    logo:               e.storeLogo        || e.storeImage || "",
    brandColor:         e.brandColor       || undefined,
    address:            e.storeAddress     || e.address    || undefined,
  };
};

/** Detecta se um ID é UUID do Supabase (vs. ID numérico do mockData). */
export const isSupabaseId = (id: string) => id.includes("-");

// ── Hook principal ────────────────────────────────────────────────────────────

export const useStores = () =>
  useQuery<MockStore[]>({
    queryKey: ["client-stores"],
    queryFn:  async () => {
      // Busca profiles e reviews em paralelo
      const [profilesRes, reviewsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, extras, verified, cnpj, role, roles")
          .not("extras", "is", null),
        supabase
          .from("reviews")
          .select("store_id, rating"),
      ]);

      // Erros no profiles são fatais; erros em reviews são silenciosos
      if (profilesRes.error) throw profilesRes.error;

      // Agrega ratings por loja
      const ratingMap: RatingMap = {};
      for (const r of reviewsRes.data ?? []) {
        if (!ratingMap[r.store_id]) ratingMap[r.store_id] = { total: 0, count: 0 };
        ratingMap[r.store_id].total += r.rating;
        ratingMap[r.store_id].count += 1;
      }

      const realStores = (profilesRes.data ?? [])
        .filter((p) => {
          const ext   = p.extras as Record<string, string> | null;
          const roles = Array.isArray(p.roles) ? (p.roles as string[]) : [];
          return (
            Boolean(ext?.storeName) &&
            (p.role === "lojista" || roles.includes("lojista"))
          );
        })
        .map((p) => profileToStore(p, ratingMap));

      // Lojas reais primeiro (locais recentes); mockData no final
      return [...realStores, ...MOCK_STORES];
    },

    // placeholderData: exibido enquanto carrega, mas NÃO vai para o cache.
    // Isso garante que o cache sempre contenha apenas dados reais + mockData
    // e elimina o bug de lojas que "desaparecem" após navegar.
    placeholderData: MOCK_STORES as MockStore[],
    staleTime:       2 * 60_000, // 2 minutos
  });
