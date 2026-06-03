import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type SellerProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  seller_kind: string;
  active: boolean;
  created_at: string;
};

import { DEMO_PRODUCTS as _DEMO_PRODUCTS } from "@/data/demoData";

// Adapta DemoProduct para o tipo SellerProduct desta página
const _now = new Date().toISOString();
const DEMO_PRODUCTS: SellerProduct[] = _DEMO_PRODUCTS.map((p) => ({
  id:          p.id,
  name:        p.name,
  description: p.description,
  price:       p.price,
  category:    p.category,
  image:       p.image,
  seller_kind: "lojista",
  active:      p.active,
  created_at:  _now,
}));

const SellerProducts = () => {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (isDemo) {
      setItems(DEMO_PRODUCTS);
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar produtos");
    } else {
      setItems((data as SellerProduct[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string, name: string) => {
    if (isDemo) {
      toast.info("Exclusão desabilitada no modo demonstração.");
      return;
    }
    if (!confirm(`Deseja excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", id)
      .eq("seller_id", user!.id);

    if (error) {
      toast.error("Erro ao excluir produto");
    } else {
      toast.success("Produto excluído");
      setItems((prev) => prev.filter((p) => p.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold">Meus produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${items.length} produto${items.length !== 1 ? "s" : ""} cadastrado${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          to="/lojista/produtos/novo"
          className="inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
        >
          <Plus className="w-4 h-4" /> Novo produto
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum produto cadastrado</p>
          <p className="text-sm mt-1">Comece cadastrando seu primeiro produto</p>
          <Link
            to="/lojista/produtos/novo"
            className="inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card mt-4"
          >
            <Plus className="w-4 h-4" /> Cadastrar produto
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-bold px-5 lg:px-6 py-3">Produto</th>
                  <th className="text-left font-bold px-3 py-3 hidden md:table-cell">Categoria</th>
                  {isDemo && <th className="text-right font-bold px-3 py-3 hidden lg:table-cell">Vendas</th>}
                  {isDemo && <th className="text-right font-bold px-3 py-3 hidden lg:table-cell">Estoque</th>}
                  {isDemo && <th className="text-right font-bold px-3 py-3 hidden lg:table-cell">Avaliação</th>}
                  <th className="text-right font-bold px-3 py-3">Preço</th>
                  <th className="text-right font-bold px-5 lg:px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 lg:px-6 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} loading="lazy" className="size-12 rounded-lg object-cover bg-muted" />
                        ) : (
                          <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{p.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground capitalize hidden md:table-cell">{p.category || "—"}</td>
                    {isDemo && (() => { const dp = _DEMO_PRODUCTS.find((d) => d.id === p.id); return (<><td className="px-3 py-3 text-right font-semibold hidden lg:table-cell">{dp?.sold ?? "—"}</td><td className="px-3 py-3 text-right font-semibold hidden lg:table-cell">{dp?.stock ?? "—"}</td><td className="px-3 py-3 text-right font-bold text-amber-500 hidden lg:table-cell">{dp ? `★ ${dp.rating}` : "—"}</td></>); })()}
                    <td className="px-3 py-3 font-extrabold text-primary text-right">R$ {p.price.toFixed(2)}</td>
                    <td className="px-5 lg:px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/lojista/produtos/editar/${p.id}`)}
                          className="size-9 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deleting === p.id}
                          className="size-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center disabled:opacity-50"
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
