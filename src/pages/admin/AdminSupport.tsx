import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare, Clock, CheckCircle2, XCircle,
  Search, Filter, ArrowRight, User, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Ticket = {
  id:         string;
  user_email: string | null;
  user_name:  string | null;
  subject:    string;
  category:   string;
  status:     string;
  created_at: string;
  updated_at: string;
  _msgCount?: number;
};

const STATUS_LABEL: Record<string, string> = {
  aberto:        "Aberto",
  em_andamento:  "Em andamento",
  resolvido:     "Resolvido",
  encerrado:     "Encerrado",
  aguardando:    "Aguardando usuário",
};

const STATUS_STYLE: Record<string, string> = {
  aberto:        "bg-destructive/10 text-destructive",
  em_andamento:  "bg-warning/15 text-warning-foreground",
  resolvido:     "bg-success/10 text-success",
  encerrado:     "bg-muted text-muted-foreground",
  aguardando:    "bg-blue-500/10 text-blue-600",
};

const CATEGORY_LABEL: Record<string, string> = {
  pedidos:        "Pedidos",
  pagamentos:     "Pagamentos",
  entregas:       "Entregas",
  conta:          "Conta",
  denuncia:       "Denúncia",
  sugestao:       "Sugestão",
  duvida:         "Dúvida geral",
  verificacao:    "Verificação de lojista",
};

const AdminSupport = () => {
  const [tickets,     setTickets]     = useState<Ticket[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filterStatus,setFilterStatus]= useState("todos");
  const [search,      setSearch]      = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      setTickets((data as Ticket[]) ?? []);
    } catch { /* tabela ainda não criada */ }
    setLoading(false);
  };

  useEffect(() => { void fetchTickets(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("support_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, status } : t));
  };

  const visible = tickets.filter((t) => {
    const matchStatus = filterStatus === "todos" || t.status === filterStatus;
    const matchSearch = !search || [t.subject, t.user_email ?? "", t.user_name ?? "", t.category]
      .some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const counts = {
    aberto:       tickets.filter((t) => t.status === "aberto").length,
    em_andamento: tickets.filter((t) => t.status === "em_andamento").length,
    resolvido:    tickets.filter((t) => t.status === "resolvido").length,
    encerrado:    tickets.filter((t) => t.status === "encerrado").length,
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administração</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Central de Atendimento</h1>
      </div>

      {/* Totais por status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { key: "aberto",       label: "Abertos",       icon: MessageSquare, color: "text-destructive", bg: "bg-destructive/10" },
          { key: "em_andamento", label: "Em andamento",  icon: Clock,         color: "text-warning",     bg: "bg-warning/10"     },
          { key: "resolvido",    label: "Resolvidos",    icon: CheckCircle2,  color: "text-success",     bg: "bg-success/10"     },
          { key: "encerrado",    label: "Encerrados",    icon: XCircle,       color: "text-muted-foreground", bg: "bg-muted"     },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(filterStatus === s.key ? "todos" : s.key)}
            className={`bg-card rounded-2xl p-5 shadow-card text-left transition-all hover:shadow-elevated ${
              filterStatus === s.key ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className={`size-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold">{counts[s.key]}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Busca + filtro */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por assunto, usuário ou categoria..."
            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => { setFilterStatus("todos"); setSearch(""); }}
          className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2 shadow-card"
        >
          <Filter className="w-4 h-4" /> Limpar
        </button>
      </div>

      {/* Lista de tickets */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-border">
          <h2 className="font-bold text-base">
            {visible.length} chamado{visible.length !== 1 ? "s" : ""}
            {filterStatus !== "todos" && ` — ${STATUS_LABEL[filterStatus] ?? filterStatus}`}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-0 divide-y divide-border">
            {[1,2,3].map((i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="h-4 w-64 bg-muted rounded mb-2" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nenhum chamado encontrado</p>
            <p className="text-sm mt-1">
              {tickets.length === 0
                ? "As tabelas do sistema de tickets ainda não foram criadas no Supabase."
                : "Tente outros filtros ou termos de busca."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((t) => (
              <Link
                key={t.id}
                to={`/admin/ticket/${t.id}`}
                className="flex items-center gap-4 px-5 lg:px-6 py-4 hover:bg-muted/30 transition-colors group"
              >
                {/* Ícone de status */}
                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${STATUS_STYLE[t.status] ?? "bg-muted text-muted-foreground"}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm truncate">{t.subject}</p>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[t.status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {t.user_name ?? t.user_email ?? "Anônimo"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {CATEGORY_LABEL[t.category] ?? t.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="flex items-center gap-2 shrink-0">
                  {t.status === "aberto" && (
                    <button
                      onClick={(e) => { e.preventDefault(); updateStatus(t.id, "em_andamento"); }}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-warning/15 text-warning-foreground hover:bg-warning/25 transition-colors"
                    >
                      Iniciar
                    </button>
                  )}
                  {(t.status === "aberto" || t.status === "em_andamento") && (
                    <button
                      onClick={(e) => { e.preventDefault(); updateStatus(t.id, "resolvido"); }}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                    >
                      Resolver
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
