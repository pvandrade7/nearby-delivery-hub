import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, Clock, CheckCircle2, Plus, DollarSign, Eye,
  BadgeCheck, FlaskConical, Users, Star, Package, ShoppingBag,
  ArrowUpRight, Repeat2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_STORE, DEMO_PRODUCTS, DEMO_ORDERS, DEMO_MONTHLY,
  DEMO_REVIEWS, DEMO_RATING_DIST, DEMO_METRICS,
} from "@/data/demoData";

// ── tipos (modo real) ────────────────────────────────────
type Order = {
  id: string;
  buyer_id: string;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; quantity: number; price: number }[];
  payment: string;
  fulfillment: string;
  address: string | null;
  buyer?: { display_name: string | null } | null;
};
type Product = { id: string; name: string; price: number; image: string | null; category: string | null };

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ── status badge ─────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    entregue:   "bg-success/15 text-success",
    saiu:       "bg-primary/15 text-primary",
    preparando: "bg-warning/20 text-warning-foreground",
    aprovado:   "bg-blue-500/15 text-blue-600",
    cancelado:  "bg-destructive/10 text-destructive",
  };
  const labels: Record<string, string> = {
    entregue: "Entregue", saiu: "Saiu p/ entrega",
    preparando: "Em preparação", aprovado: "Aprovado", cancelado: "Cancelado",
  };
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {labels[status] ?? status}
    </span>
  );
};

// ── tooltip customizado para Recharts ────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-elevated text-xs space-y-1">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground">
          {p.name}: <span className="font-extrabold text-foreground">
            {p.name.toLowerCase().includes("receita") || p.name.toLowerCase().includes("meta")
              ? `R$ ${Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEMO DASHBOARD — exibido apenas em isDemo = true
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DemoDashboard = () => {
  const m = DEMO_METRICS;

  const topProducts = [...DEMO_PRODUCTS]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map((p) => ({ name: p.name.split(" ").slice(0, 2).join(" "), vendas: p.sold }));

  const statCards = [
    { label: "Receita total",       value: `R$ ${m.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, delta: `↑ ${m.crescimentoMes}% este mês`, icon: DollarSign,  accent: "text-primary",     bg: "bg-primary/10" },
    { label: "Receita do mês",      value: `R$ ${m.receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,   delta: "Junho/2026",                         icon: TrendingUp,  accent: "text-secondary",   bg: "bg-secondary/10" },
    { label: "Total de pedidos",    value: String(m.totalPedidos),                                                         delta: `${m.pedidosEntregues} entregues`,     icon: ShoppingBag, accent: "text-blue-500",    bg: "bg-blue-500/10" },
    { label: "Em andamento",        value: String(m.emAndamento),                                                          delta: "aguardando ação",                    icon: Clock,       accent: "text-warning",     bg: "bg-warning/15" },
    { label: "Clientes atendidos",  value: String(m.clientesAtendidos),                                                    delta: `${m.taxaRepeticao}% voltaram`,       icon: Users,       accent: "text-violet-500",  bg: "bg-violet-500/10" },
    { label: "Produtos ativos",     value: String(m.produtosCadastrados),                                                  delta: "no catálogo",                        icon: Package,     accent: "text-cyan-500",    bg: "bg-cyan-500/10" },
    { label: "Ticket médio",        value: `R$ ${m.ticketMedio.toFixed(2)}`,                                               delta: "por pedido",                         icon: Repeat2,     accent: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Avaliação média",     value: `${DEMO_STORE.rating} ★`,                                                       delta: `${DEMO_STORE.totalReviews} avaliações`, icon: Star,     accent: "text-amber-500",   bg: "bg-amber-500/10" },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <FlaskConical className="w-3.5 h-3.5" /> Modo Demonstração
            </span>
            <VerifiedBadge compact />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bom dia, {DEMO_STORE.ownerName}
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-0.5">{DEMO_STORE.storeName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {DEMO_STORE.category} · Fortaleza, CE · Loja ativa desde {DEMO_STORE.since}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/lojista/verificacao"
            className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow text-sm">
            <BadgeCheck className="w-4 h-4 text-success" /> Verificação
          </Link>
          <Link to="/lojista/produtos/novo"
            className="inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow text-sm">
            <Plus className="w-4 h-4" /> Cadastrar produto
          </Link>
        </div>
      </div>

      {/* 8 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
            <div className={`size-10 rounded-xl ${s.bg} ${s.accent} flex items-center justify-center`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold mt-4">{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
            <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${s.accent}`}>
              {s.delta.startsWith("↑") && <ArrowUpRight className="w-3 h-3" />}
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico de receita mensal + top produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 lg:p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-base">Receita mensal</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses vs meta</p>
            </div>
            <span className="text-sm font-extrabold text-primary">
              R$ {(DEMO_MONTHLY.reduce((s, mn) => s + mn.receita, 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={DEMO_MONTHLY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(var(--primary))"
                fill="url(#gradReceita)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              <Area type="monotone" dataKey="meta" name="Meta" stroke="hsl(var(--muted-foreground))"
                fill="transparent" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="mb-5">
            <h2 className="font-bold text-base">Mais vendidos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top 5 por unidades</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="vendas" name="Vendas" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pedidos recentes + produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 lg:px-6 py-4 flex items-center justify-between border-b border-border">
            <h2 className="font-bold text-base">Pedidos recentes</h2>
            <Link to="/lojista/pedidos" className="text-sm text-primary font-semibold hover:underline">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-bold px-5 py-3">Pedido</th>
                  <th className="text-left font-bold px-3 py-3 hidden sm:table-cell">Cliente</th>
                  <th className="text-left font-bold px-3 py-3">Status</th>
                  <th className="text-right font-bold px-3 py-3">Total</th>
                  <th className="text-right font-bold px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {DEMO_ORDERS.slice(0, 7).map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-xs">{o.id}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell text-xs">{o.customer}</td>
                    <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-3 py-3 font-extrabold text-primary text-right text-sm">R$ {o.total.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to="/lojista/pedidos" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">Produtos</h2>
            <Link to="/lojista/produtos" className="text-xs text-primary font-semibold hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {DEMO_PRODUCTS.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <img src={p.image} alt="" className="size-10 rounded-lg object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)} · {p.sold} vendas</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-amber-500">★ {p.rating}</p>
                  <p className="text-[10px] text-muted-foreground">{p.stock} em estoque</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avaliações */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-base">Avaliações dos clientes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{DEMO_STORE.totalReviews} avaliações no total</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-amber-500">{DEMO_STORE.rating}</p>
              <div className="flex gap-0.5 mt-0.5">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">de 5 estrelas</p>
            </div>
            <div className="space-y-1 hidden sm:block">
              {([5,4,3,2,1] as const).map((n) => {
                const count = DEMO_RATING_DIST[n];
                const pct = Math.round((count / DEMO_STORE.totalReviews) * 100);
                return (
                  <div key={n} className="flex items-center gap-2 text-[11px]">
                    <span className="w-8 text-right font-semibold text-muted-foreground">{n}★</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {DEMO_REVIEWS.slice(0, 5).map((r) => (
            <div key={r.id} className="px-5 lg:px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-extrabold text-sm shrink-0">
                    {r.customer[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold">{r.customer}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={`w-3 h-3 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">{r.product}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.comment}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">há {r.ago}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD REAL — dados do Supabase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SellerDashboard = () => {
  const { user, isDemo } = useAuth();

  if (isDemo) return <DemoDashboard />;

  const [displayName, setDisplayName] = useState("");
  const [storeName,   setStoreName]   = useState("");
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [products,    setProducts]    = useState<Product[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // 1) Perfil
      const { data: prof } = await supabase
        .from("profiles").select("display_name, extras").eq("id", user.id).maybeSingle();
      const ext   = prof?.extras as Record<string, string> | null;
      const sName = ext?.storeName ?? "";
      const uName = prof?.display_name || user.email?.split("@")[0] || "";
      setDisplayName(uName);
      setStoreName(sName);

      // 2) Pedidos com nome do comprador
      if (sName) {
        const { data: ord } = await supabase
          .from("orders")
          .select("*, buyer:profiles!buyer_id(display_name)")
          .eq("store_name", sName)
          .order("created_at", { ascending: false });
        setOrders((ord as unknown as Order[]) ?? []);
      }

      // 3) Produtos ativos
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, price, image, category")
        .eq("seller_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      setProducts((prod as Product[]) ?? []);
      setLoading(false);
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Métricas calculadas ──────────────────────────────
  const now = new Date();
  const mesAtual = MONTH_NAMES[now.getMonth()];

  const receitaTotal = orders.reduce((s, o) => s + o.total, 0);
  const receitaMes   = orders
    .filter((o) => { const d = new Date(o.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s, o) => s + o.total, 0);
  const totalPedidos   = orders.length;
  const emAndamento    = orders.filter((o) => ["aprovado","preparando","saiu"].includes(o.status)).length;
  const entregues      = orders.filter((o) => o.status === "entregue").length;
  const ticketMedio    = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;
  const clientesUnicos = new Set(orders.map((o) => o.buyer_id)).size;
  const produtosAtivos = products.length;

  // Receita por mês (últimos 6)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now); d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(); const y = d.getFullYear();
    const receita = orders
      .filter((o) => { const od = new Date(o.created_at); return od.getMonth() === m && od.getFullYear() === y; })
      .reduce((s, o) => s + o.total, 0);
    return { month: MONTH_NAMES[m], receita };
  });

  // Top produtos por unidades vendidas (de items dos pedidos)
  const productSales: Record<string, number> = {};
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((item) => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });
    }
  });
  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, vendas]) => ({ name: name.split(" ").slice(0, 2).join(" "), vendas }));

  const statCards = [
    { label: "Receita total",      value: `R$ ${receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, delta: `${mesAtual}/${now.getFullYear()}`,  icon: DollarSign,  accent: "text-primary",     bg: "bg-primary/10"     },
    { label: "Receita do mês",     value: `R$ ${receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,   delta: `${mesAtual}/${now.getFullYear()}`,  icon: TrendingUp,  accent: "text-secondary",   bg: "bg-secondary/10"   },
    { label: "Total de pedidos",   value: String(totalPedidos),                                                        delta: `${entregues} entregues`,            icon: ShoppingBag, accent: "text-blue-500",    bg: "bg-blue-500/10"    },
    { label: "Em andamento",       value: String(emAndamento),                                                         delta: "aguardando ação",                   icon: Clock,       accent: "text-warning",     bg: "bg-warning/15"     },
    { label: "Clientes atendidos", value: String(clientesUnicos),                                                      delta: "clientes únicos",                   icon: Users,       accent: "text-violet-500",  bg: "bg-violet-500/10"  },
    { label: "Produtos ativos",    value: String(produtosAtivos),                                                      delta: "no catálogo",                       icon: Package,     accent: "text-cyan-500",    bg: "bg-cyan-500/10"    },
    { label: "Ticket médio",       value: `R$ ${ticketMedio.toFixed(2)}`,                                              delta: "por pedido",                        icon: Repeat2,     accent: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Avaliação média",    value: "–",                                                                         delta: "sem avaliações ainda",              icon: Star,        accent: "text-amber-500",   bg: "bg-amber-500/10"   },
  ];

  const recent = orders.slice(0, 7);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <VerifiedBadge compact />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bom dia{displayName ? `, ${displayName}` : ""}
            {storeName ? ` · ${storeName}` : ""}
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-0.5">Painel da loja</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/lojista/verificacao"
            className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow text-sm">
            <BadgeCheck className="w-4 h-4 text-success" /> Verificação
          </Link>
          <Link to="/lojista/produtos/novo"
            className="inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow text-sm">
            <Plus className="w-4 h-4" /> Cadastrar produto
          </Link>
        </div>
      </div>

      {/* 8 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
            <div className={`size-10 rounded-xl ${s.bg} ${s.accent} flex items-center justify-center`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold mt-4">{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
            <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${s.accent}`}>
              {s.delta.startsWith("↑") && <ArrowUpRight className="w-3 h-3" />}
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AreaChart — receita mensal */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 lg:p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-base">Receita mensal</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
            <span className="text-sm font-extrabold text-primary">
              R$ {monthlyData.reduce((s, mn) => s + mn.receita, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceitaReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(var(--primary))"
                fill="url(#gradReceitaReal)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* BarChart — top produtos mais vendidos */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="mb-5">
            <h2 className="font-bold text-base">Mais vendidos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top 5 por unidades</p>
          </div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="vendas" name="Vendas" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-sm text-muted-foreground text-center gap-2">
              <Package className="w-8 h-8 opacity-25" />
              <p>Sem dados de vendas<br />para exibir ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pedidos recentes + produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 lg:px-6 py-4 flex items-center justify-between border-b border-border">
            <h2 className="font-bold text-base">Pedidos recentes</h2>
            <Link to="/lojista/pedidos" className="text-sm text-primary font-semibold hover:underline">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {storeName ? "Nenhum pedido recebido ainda." : "Configure o nome da loja em Configurações para ver os pedidos."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-bold px-5 py-3">Pedido</th>
                    <th className="text-left font-bold px-3 py-3 hidden sm:table-cell">Cliente</th>
                    <th className="text-left font-bold px-3 py-3">Status</th>
                    <th className="text-right font-bold px-3 py-3">Total</th>
                    <th className="text-right font-bold px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-bold text-xs">#{o.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                        {o.buyer?.display_name ?? "Cliente"}
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-3 py-3 font-extrabold text-primary text-right text-sm">R$ {o.total.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link to="/lojista/pedidos" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">Produtos</h2>
            <Link to="/lojista/produtos" className="text-xs text-primary font-semibold hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {products.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                {p.image
                  ? <img src={p.image} alt="" className="size-10 rounded-lg object-cover bg-muted shrink-0" />
                  : <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">{p.name[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {p.price.toFixed(2)}{p.category ? ` · ${p.category}` : ""}
                  </p>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto cadastrado ainda.</p>
            )}
          </div>
        </div>
      </div>

      {/* Avaliações — estado vazio (tabela de avaliações não disponível ainda) */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-base">Avaliações dos clientes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Avaliações dos seus compradores</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Star className="w-8 h-8 opacity-25" />
          <p className="text-sm font-semibold">Nenhuma avaliação recebida ainda.</p>
          <p className="text-xs">As avaliações dos clientes aparecerão aqui após as primeiras compras.</p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
