import { useEffect, useState } from "react";
import {
  Store, Trash2, X, Search, BadgeCheck,
  ShieldOff, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { toast } from "sonner";

type StoreRow = {
  id:         string;
  ownerName:  string;
  ownerEmail: string;
  storeName:  string;
  category:   string;
  address:    string;
  verified:   boolean;
};

// ── Modal de confirmação de exclusão ─────────────────────
const DeleteModal = ({
  store,
  onConfirm,
  onCancel,
  busy,
}: {
  store: StoreRow;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-card rounded-2xl shadow-elevated w-full max-w-md p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-lg">Excluir loja</h2>
        <button
          onClick={onCancel}
          className="size-8 rounded-full bg-muted flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-destructive">Ação irreversível</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Todos os dados da loja e produtos serão removidos permanentemente.
            A conta do lojista será mantida, mas sem perfil de loja.
          </p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs text-muted-foreground">Loja a ser excluída</p>
        <p className="font-extrabold text-base">{store.storeName}</p>
        <p className="text-xs text-muted-foreground">
          Proprietário: <span className="font-semibold text-foreground">{store.ownerName}</span>
          {" "}· {store.ownerEmail}
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-xl border border-border py-3 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 rounded-xl bg-destructive text-destructive-foreground py-3 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? (
            <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Excluindo...</>
          ) : (
            <><Trash2 className="w-4 h-4" /> Excluir loja</>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ── Página principal ──────────────────────────────────────
const AdminStores = () => {
  const queryClient = useQueryClient();
  const [stores,  setStores]  = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [toDelete, setToDelete] = useState<StoreRow | null>(null);
  const [busy,    setBusy]    = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, phone, extras, verified")
        .not("extras", "is", null);

      if (error) throw error;

      const rows: StoreRow[] = (data ?? [])
        .filter((p) => {
          const ext = p.extras as Record<string, string> | null;
          return Boolean(ext?.storeName);
        })
        .map((p) => {
          const ext = (p.extras as Record<string, string>) ?? {};
          return {
            id:         p.id,
            ownerName:  p.display_name || "—",
            ownerEmail: p.phone        || ext.whatsapp || "—",
            storeName:  ext.storeName           || "—",
            category:   ext.storeCategory || ext.category || "—",
            address:    ext.storeAddress  || ext.address  || "—",
            verified:   Boolean(p.verified),
          };
        });

      setStores(rows);
    } catch (err) {
      toast.error("Erro ao carregar lojas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      // 1. Remover produtos da loja
      await supabase.from("products").delete().eq("seller_id", toDelete.id);

      // 2. Limpar dados da loja via função com SECURITY DEFINER (bypassa RLS)
      const { error: rpcError } = await supabase
        .rpc("admin_delete_store", { store_owner_id: toDelete.id });

      if (rpcError) throw rpcError;

      void logAudit("store_deleted", "profile", toDelete.id, {
        store_name:  toDelete.storeName,
        owner_name:  toDelete.ownerName,
        owner_email: toDelete.ownerEmail,
        category:    toDelete.category,
      });
      toast.success(`Loja "${toDelete.storeName}" excluída com sucesso.`);
      setStores((prev) => prev.filter((s) => s.id !== toDelete.id));
      setToDelete(null);
      // Força refetch imediato do cache de lojas em todos os componentes
      queryClient.removeQueries({ queryKey: ["client-stores"] });
    } catch (err) {
      toast.error("Erro ao excluir a loja. Tente novamente.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const filtered = stores.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.storeName.toLowerCase().includes(q)  ||
      s.ownerName.toLowerCase().includes(q)  ||
      s.ownerEmail.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administração</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Gerenciar lojas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${stores.length} loja(s) cadastrada(s) na plataforma`}
          </p>
        </div>
        <button
          onClick={fetchStores}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Busca */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome da loja, proprietário, email ou categoria..."
          className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-5 shadow-card animate-pulse flex gap-4">
              <div className="size-12 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 shadow-card flex flex-col items-center gap-3 text-center">
          <Store className="w-10 h-10 text-muted-foreground" />
          <p className="font-bold text-base">
            {search ? "Nenhuma loja encontrada para esta busca" : "Nenhuma loja cadastrada ainda"}
          </p>
          <p className="text-sm text-muted-foreground">
            {search ? "Tente outros termos de busca." : "As lojas aparecerão aqui após o cadastro."}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Loja</th>
                <th className="text-left px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Proprietário / Contato</th>
                <th className="text-left px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Categoria</th>
                <th className="text-center px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="text-center px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((store) => (
                <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                  {/* Loja */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{store.storeName}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{store.address}</p>
                      </div>
                    </div>
                  </td>

                  {/* Proprietário */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="font-semibold">{store.ownerName}</p>
                    <p className="text-xs text-muted-foreground">{store.ownerEmail}</p>
                  </td>

                  {/* Categoria */}
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      {store.category}
                    </span>
                  </td>

                  {/* Status verificação */}
                  <td className="px-5 py-4 text-center">
                    {store.verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-success/15 text-success">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verificada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                        <ShieldOff className="w-3.5 h-3.5" /> Não verificada
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => setToDelete(store)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Rodapé com total */}
          <div className="px-5 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Exibindo <span className="font-bold text-foreground">{filtered.length}</span> de{" "}
              <span className="font-bold text-foreground">{stores.length}</span> lojas
            </p>
          </div>
        </div>
      )}

      {/* Modal de exclusão */}
      {toDelete && (
        <DeleteModal
          store={toDelete}
          onConfirm={handleDelete}
          onCancel={() => !busy && setToDelete(null)}
          busy={busy}
        />
      )}
    </div>
  );
};

export default AdminStores;
