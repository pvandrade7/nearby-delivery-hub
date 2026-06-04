import { useEffect, useState } from "react";
import {
  ScrollText, RefreshCw, ChevronDown, ChevronRight,
  ShoppingBag, BadgeCheck, Store, Package, Trash2,
  User, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AuditEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  _user_name?: string;
};

const ACTION_META: Record<string, { label: string; icon: typeof ShoppingBag; color: string }> = {
  order_status_changed:   { label: "Status de pedido",       icon: ShoppingBag, color: "bg-blue-500/15 text-blue-600"          },
  verification_approved:  { label: "Verificação aprovada",   icon: BadgeCheck,  color: "bg-success/15 text-success"            },
  verification_rejected:  { label: "Verificação reprovada",  icon: Shield,      color: "bg-destructive/10 text-destructive"    },
  verification_in_review: { label: "Verificação em análise", icon: Shield,      color: "bg-warning/15 text-warning-foreground" },
  store_created:          { label: "Loja criada",            icon: Store,       color: "bg-primary/10 text-primary"            },
  store_updated:          { label: "Loja atualizada",        icon: Store,       color: "bg-primary/10 text-primary"            },
  store_deleted:          { label: "Loja excluída",          icon: Trash2,      color: "bg-destructive/10 text-destructive"    },
  product_created:        { label: "Produto criado",         icon: Package,     color: "bg-success/10 text-success"            },
  product_updated:        { label: "Produto atualizado",     icon: Package,     color: "bg-success/10 text-success"            },
};

const ALL_ACTIONS = Object.keys(ACTION_META);

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const AdminAuditLog = () => {
  const [logs,    setLogs]    = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = (supabase as never as {
        from: (t: string) => {
          select: (cols: string) => {
            order: (col: string, opts: object) => { limit: (n: number) => Promise<{ data: AuditEntry[] | null }> }
          }
        }
      }).from("audit_logs")
        .select("id, user_id, action, entity_type, entity_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      const { data } = await query;
      const entries = (data ?? []) as AuditEntry[];

      // Busca nomes de usuários em batch (única query)
      const userIds = [...new Set(entries.map((e) => e.user_id).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);
        const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "—"]));
        entries.forEach((e) => { if (e.user_id) e._user_name = nameMap.get(e.user_id) ?? e.user_id.slice(0, 8); });
      }

      setLogs(entries);
    } catch { /* tabela ainda não criada */ }
    setLoading(false);
  };

  useEffect(() => { void fetchLogs(); }, []);

  const visible = filter === "all" ? logs : logs.filter((l) => l.action === filter);

  const counts = ALL_ACTIONS.reduce<Record<string, number>>((acc, a) => {
    acc[a] = logs.filter((l) => l.action === a).length;
    return acc;
  }, {});

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administração</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Logs de Auditoria</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rastreabilidade de ações críticas no sistema
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-colors shadow-card"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Filtros por ação */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Todos ({logs.length})
        </button>
        {ALL_ACTIONS.filter((a) => counts[a] > 0).map((a) => {
          const meta = ACTION_META[a];
          return (
            <button
              key={a}
              onClick={() => setFilter(filter === a ? "all" : a)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                filter === a
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {meta.label} ({counts[a]})
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="font-bold text-sm">
            {visible.length} registro{visible.length !== 1 ? "s" : ""}
            {filter !== "all" && ` — ${ACTION_META[filter]?.label ?? filter}`}
          </p>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-5 py-4 flex gap-3 animate-pulse">
                <div className="size-9 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="font-semibold">
              {logs.length === 0
                ? "Nenhum log registrado ainda. Aplique as migrations no Supabase."
                : "Nenhum evento para esse filtro."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((entry) => {
              const meta = ACTION_META[entry.action] ?? {
                label: entry.action, icon: ScrollText, color: "bg-muted text-muted-foreground",
              };
              const Icon = meta.icon;
              const isOpen = expanded === entry.id;

              return (
                <div key={entry.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : entry.id)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
                          {meta.label}
                        </span>
                        {entry.entity_type && (
                          <span className="text-xs text-muted-foreground">
                            {entry.entity_type}
                            {entry.entity_id && ` #${entry.entity_id.slice(0, 8).toUpperCase()}`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {(entry._user_name || entry.user_id) && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {entry._user_name ?? entry.user_id?.slice(0, 8).toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{fmt(entry.created_at)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-muted-foreground">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && entry.details && (
                    <div className="px-5 pb-4 pt-1 bg-muted/20 border-t border-border">
                      <pre className="text-xs text-muted-foreground bg-muted rounded-xl p-3 overflow-x-auto leading-relaxed">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLog;
