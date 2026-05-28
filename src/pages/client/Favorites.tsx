import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Store, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Favorite = {
  id: string;
  store_id: string;
  store_name: string;
  store_image: string;
  store_category: string;
  created_at: string;
};

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFavorites((data as Favorite[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover favorito"); return; }
    toast.success("Removido dos favoritos");
    load();
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold">Favoritos</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-base">Nenhuma loja favorita</p>
          <p className="text-sm mt-1">Explore lojas e toque no coração para salvar suas favoritas</p>
          <button
            onClick={() => navigate("/cliente/lojas")}
            className="mt-5 px-6 py-3 rounded-2xl gradient-brand text-primary-foreground font-bold text-sm"
          >
            Explorar lojas
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map(fav => (
            <div
              key={fav.id}
              className="bg-card rounded-2xl shadow-card overflow-hidden flex"
            >
              <button
                onClick={() => navigate(`/cliente/loja/${fav.store_id}`)}
                className="flex items-center gap-4 flex-1 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                  {fav.store_image ? (
                    <img src={fav.store_image} alt={fav.store_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{fav.store_name}</p>
                  {fav.store_category && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 inline-block">
                      {fav.store_category}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => remove(fav.id)}
                className="px-4 text-destructive hover:bg-destructive/10 transition-colors shrink-0 border-l border-border"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
