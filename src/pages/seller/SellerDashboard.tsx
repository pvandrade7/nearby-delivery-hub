import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Clock, CheckCircle2, Plus, DollarSign, Eye, BadgeCheck } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; quantity: number; price: number }[];
  payment: string;
  fulfillment: string;
  address: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const SellerDashboard = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [storeName, setStoreName]     = useState("");
  const [orders, setOrders]           = useState<Order[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Carrega perfil
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, extras")
        .eq("id", user.id)
        .maybeSingle();

      const ext = prof?.extras as Record<string, string> | null;
      const sName = ext?.storeName ?? "";
      const uName = prof?.display_name || user.email?.split("@")[0] || "";
      setDisplayName(sName ? `${uName} · ${sName}` : uName);
      setStoreName(sName);

      // Carrega pedidos da loja
      if (sName) {
        const { data: ordersData } = await supabase
          .from("orders")
          .select("*")
          .eq("store_name", sName)
          .order("created_at", { ascending: false });
        setOrders((ordersData as Order[]) ?? []);
      }

      // Carrega produtos do lojista
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price, image, category")
        .eq("seller_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      setProducts((productsData as Product[]) ?? []);

      setLoading(false);
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cálculos de métricas ─────────────────────────────
  const todayStr = new Date().toDateString();

  const ordersToday = orders.filter(
    (o) => new Date(o.created_at).toDateString() === todayStr
  );
  const totalToday = ordersToday.reduce((s, o) => s + o.total, 0);
  const inProgress = orders.filter((o) => ["aprovado", "preparando", "saiu"].includes(o.status)).length;
  const done       = orders.filter((o) => o.status === "entregue").length;

  const stats = [
    { label: "Vendas hoje",   value: `R$ ${totalToday.toFixed(2)}`, delta: `${ordersToday.length} pedido(s)`,          icon: DollarSign,  accent: "text-primary",   bg: "bg-primary/10" },
    { label: "Total pedidos", value: String(orders.length),          delta: `${done} concluído(s)`,                    icon: TrendingUp,  accent: "text-secondary", bg: "bg-secondary/10" },
    { label: "Em andamento",  value: String(inProgress),             delta: "aguardando ação",                          icon: Clock,       accent: "text-warning",   bg: "bg-warning/15" },
    { label: "Concluídos",    value: String(done),                    delta: orders.length ? `${Math.round((done / orders.length) * 100)}% no prazo` : "–", icon: CheckCircle2, accent: "text-success", bg: "bg-success/15" },
  ];

  // ── Gráfico de vendas — últimos 7 dias ───────────────
  const salesByDay: Record<string, number> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    salesByDay[d.toDateString()] = 0;
  }
  orders.forEach((o) => {
    const key = new Date(o.created_at).toDateString();
    if (key in salesByDay) salesByDay[key] += o.total;
  });
  const sales = Object.entries(salesByDay).map(([dateStr, v]) => ({
    d: DAYS[new Date(dateStr).getDay()],
    v,
    isToday: dateStr === todayStr,
  }));
  const weekTotal = sales.reduce((s, d) => s + d.v, 0);
  const maxSale = Math.max(...sales.map((s) => s.v), 1);

  const recent = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bom dia{displayName ? `, ${displayName}` : ""}
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Painel da loja</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <VerifiedBadge />
          <Link
            to="/lojista/verificacao"
            className="inline-flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
          >
            <BadgeCheck className="w-4 h-4 text-success" /> Verificação
          </Link>
          <Link
            to="/lojista/produtos/novo"
            className="inline-flex items-center justify-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
          >
            <Plus className="w-4 h-4" /> Cadastrar produto
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div className={`size-10 rounded-xl ${s.bg} ${s.accent} flex items-center justify-center`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold mt-4">{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
            <p className={`text-xs font-semibold mt-2 ${s.accent}`}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Charts + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 lg:p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-base">Vendas da semana</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 7 dias</p>
            </div>
            <span className="text-sm font-extrabold text-primary">R$ {weekTotal.toFixed(2)}</span>
          </div>
          <div className="h-56 flex items-end gap-3 lg:gap-5">
            {sales.map((s) => {
              const h = maxSale > 0 ? Math.max(Math.round((s.v / maxSale) * 100), s.v > 0 ? 5 : 2) : 2;
              return (
                <div key={s.d} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg ${s.isToday ? "gradient-brand" : "bg-accent"}`}
                      style={{ height: `${h}%` }}
                      title={`R$ ${s.v.toFixed(2)}`}
                    />
                  </div>
                  <span className={`text-[11px] font-bold ${s.isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {s.d}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-base mb-4">Meus produtos</h2>
          {products.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <p>Nenhum produto cadastrado ainda.</p>
              <Link to="/lojista/produtos/novo" className="text-primary font-semibold mt-2 inline-block hover:underline">
                Cadastrar produto →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-muted-foreground w-4">{i + 1}</span>
                  {p.image ? (
                    <img src={p.image} alt="" className="size-10 rounded-lg object-cover bg-muted" />
                  ) : (
                    <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                      {p.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 flex items-center justify-between border-b border-border">
          <h2 className="font-bold text-base">Pedidos recentes</h2>
          <Link to="/lojista/pedidos" className="text-sm text-primary font-semibold hover:underline">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {storeName ? "Nenhum pedido recebido ainda." : "Configure o nome da sua loja em Configurações para ver os pedidos."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-bold px-5 lg:px-6 py-3">Pedido</th>
                  <th className="text-left font-bold px-3 py-3 hidden md:table-cell">Itens</th>
                  <th className="text-left font-bold px-3 py-3">Status</th>
                  <th className="text-right font-bold px-3 py-3">Total</th>
                  <th className="text-right font-bold px-5 lg:px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 lg:px-6 py-3 font-bold">#{o.id.slice(0, 8)}</td>
                    <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{Array.isArray(o.items) ? o.items.length : 0} item(ns)</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        o.status === "entregue" ? "bg-success/15 text-success"
                        : o.status === "saiu" ? "bg-primary/15 text-primary"
                        : o.status === "preparando" ? "bg-warning/20 text-warning-foreground"
                        : "bg-blue-500/15 text-blue-600"
                      }`}>
                        {o.status === "preparando" ? "Em preparação"
                         : o.status === "saiu" ? "Saiu p/ entrega"
                         : o.status === "entregue" ? "Entregue"
                         : "Aprovado"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-extrabold text-primary text-right">R$ {o.total.toFixed(2)}</td>
                    <td className="px-5 lg:px-6 py-3 text-right">
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
    </div>
  );
};

export default SellerDashboard;
