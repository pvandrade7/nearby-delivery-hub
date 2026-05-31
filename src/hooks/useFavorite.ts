import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type StoreInfo = {
  id: string;
  name: string;
  image?: string;
  category?: string;
};

export function useFavorite(store: StoreInfo) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verifica se já está favoritado ao montar
  useEffect(() => {
    if (!user || !store.id) return;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("store_id", store.id)
      .maybeSingle()
      .then(({ data }) => setFavorited(Boolean(data)));
  }, [user?.id, store.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(async () => {
    if (!user) {
      toast.error("Faça login para salvar favoritos");
      return;
    }
    if (loading) return;
    setLoading(true);

    if (favorited) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("store_id", store.id);

      if (error) {
        toast.error("Erro ao remover favorito");
      } else {
        setFavorited(false);
        toast.success("Removido dos favoritos");
      }
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        store_id: store.id,
        store_name: store.name,
        store_image: store.image ?? "",
        store_category: store.category ?? "",
      });

      if (error && error.code === "23505") {
        // Unique violation — já existe, apenas marca como favoritado
        setFavorited(true);
      } else if (error) {
        toast.error("Erro ao salvar favorito");
      } else {
        setFavorited(true);
        toast.success("Loja salva nos favoritos!");
      }
    }
    setLoading(false);
  }, [user, store, favorited, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return { favorited, toggle, loading };
}
