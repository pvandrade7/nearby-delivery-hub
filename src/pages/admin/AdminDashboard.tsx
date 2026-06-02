import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Store, BadgeCheck, MessageSquare, ShieldCheck,
  TrendingUp, Clock, CheckCircle2, XCircle, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stats = {
  totalUsers:           number;
  totalStores:          number;
  pendingVerifications: number;
  openTickets:          number;
  inProgressTickets:    number;
  resolvedTickets:      number;
};

const AdminDashboard = () => {
  const [stats,   setStats]   = useState<Stats>({ totalUsers: 0, totalStores: 0, pendingVerifications: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, profilesRes, ticketsRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id, extras").not("extras", "is", null),
          supabase.from("support_tickets").select("id, status"),
        ]);

        const profiles = profilesRes.data ?? [];
        const pendingCount = profiles.filter((p) => {
          const ext = p.extras as Record<string, string> | null;
          return ext?.verificationStatus === "pendente";
        }).length;
        const storeCount = profiles.filter((p) => {
          const ext = p.extras as Record<string, string> | null;
          return Boolean(ext?.storeName);
        }).length;

        const tickets = ticketsRes.data ?? [];
        setStats({
          totalUsers:           usersRes.count ?? 0,
          totalStores:          storeCount,
          pendingVerifications: pendingCount,
          openTickets:          tickets.filter((t) => t.status === "aberto").length,
          inProgressTickets:    tickets.filter((t) => t.status === "em_andamento").length,
          resolvedTickets:      tickets.filter((t) => t.status === "resolvido").length,
        });
      } catch { /* tabelas ainda não criadas */ }
      finally { setLoading(false); }
    })();
  }, []);

  const statCards = [
    { label: "Usuários cadastrados",      value: stats.totalUsers,           icon: Users,        color: "text-blue-500",   bg: "bg-blue-500/10"   },
    { label: "Lojas ativas",              value: stats.totalStores,           icon: Store,        color: "text-primary",    bg: "bg-primary/10"    },
    { label: "Verificações pendentes",    value: stats.pendingVerifications,  icon: BadgeCheck,   color: "text-warning",    bg: "bg-warning/10"    },
    { label: "Chamados abertos",          value: stats.openTickets,           icon: MessageSquare,color: "text-destructive", bg: "bg-destructive/10"},
  ];

  const quickLinks = [
    { to: "/admin/verificacoes", icon: BadgeCheck,   label: "Fila de verificação",    desc: `${stats.pendingVerifications} pendente(s)`,  accent: "text-warning"     },
    { to: "/admin/suporte",      icon: MessageSquare,label: "Central de suporte",     desc: `${stats.openTickets} aberto(s)`,             accent: "text-destructive" },
    { to: "/admin/usuarios",     icon: Users,         label: "Gerenciar usuários",    desc: `${stats.totalUsers} cadastrado(s)`,          accent: "text-blue-500"    },
    { to: "/admin/lojas",        icon: Store,         label: "Gerenciar lojas",       desc: `${stats.totalStores} ativa(s)`,              accent: "text-primary"     },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administração</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral da plataforma Vendy+</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-5 shadow-card animate-pulse">
              <div className="h-5 w-5 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded mb-1" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
              <div className={`size-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-extrabold">{s.value}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick access */}
      <div>
        <h2 className="font-bold text-base mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all group flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <q.icon className={`w-5 h-5 ${q.accent}`} />
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <p className="font-bold text-sm">{q.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Status dos tickets */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-base">Status dos chamados</h2>
          <Link to="/admin/suporte" className="text-sm text-primary font-semibold hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Abertos",        value: stats.openTickets,       icon: MessageSquare, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Em andamento",   value: stats.inProgressTickets, icon: Clock,         color: "text-warning",     bg: "bg-warning/10"     },
            { label: "Resolvidos",     value: stats.resolvedTickets,   icon: CheckCircle2,  color: "text-success",     bg: "bg-success/10"     },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-4 px-5 lg:px-6 py-4">
              <div className={`size-9 rounded-xl ${row.bg} ${row.color} flex items-center justify-center shrink-0`}>
                <row.icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-semibold">{row.label}</span>
              <span className="text-2xl font-extrabold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso de configuração */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-blue-800 dark:text-blue-300">Configuração do administrador</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
              Para o login de administrador funcionar com <strong>adm@gmail.com / 202020</strong>, crie o usuário no
              Supabase Auth (mínimo 6 caracteres na senha) e execute no SQL Editor:
            </p>
            <code className="block mt-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[11px] font-mono rounded-lg px-3 py-2 leading-relaxed">
              UPDATE profiles SET role = 'admin'<br />
              WHERE id = '&lt;uuid do usuário adm@gmail.com&gt;';
            </code>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
              Também execute o SQL das tabelas <code>support_tickets</code> e <code>ticket_messages</code> disponível em{" "}
              <code>src/integrations/supabase/types.ts</code>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
