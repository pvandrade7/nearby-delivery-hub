import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Clock, CheckCircle2, Plus, DollarSign, Eye, BadgeCheck, FlaskConical } from "lucide-react";
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

// ── Dados demonstrativos — exibidos quando a loja ainda não tem dados reais ──
const _now = new Date();
const _d = (n: number) => {
  const d = new Date(_now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const DEMO_ORDERS: Order[] = [
  { id: "a1b2c3d4e5f6a1b2", total: 189.90, status: "entregue",   created_at: _d(0), items: [{ name: "Produto Premium",  quantity: 2, price: 94.95 }], payment: "pix",      fulfillment: "delivery", address: "Rua das Flores, 123" },
  { id: "b2c3d4e5f6a7b2c3", total: 79.90,  status: "preparando", created_at: _d(0), items: [{ name: "Item Especial",    quantity: 1, price: 79.90 }], payment: "cartao",   fulfillment: "delivery", address: "Av. Central, 456" },
  { id: "c3d4e5f6a7b8c3d4", total: 249.00, status: "saiu",       created_at: _d(1), items: [{ name: "Kit Completo",     quantity: 3, price: 83.00 }], payment: "pix",      fulfillment: "delivery", address: "Rua Nova, 789" },
  { id: "d4e5f6a7b8c9d4e5", total: 59.90,  status: "entregue",   created_at: _d(1), items: [{ name: "Produto Básico",   quantity: 1, price: 59.90 }], payment: "dinheiro", fulfillment: "pickup",   address: null },
  { id: "e5f6a7b8c9d0e5f6", total: 134.50, status: "entregue",   created_at: _d(2), items: [{ name: "Acessório Plus",   quantity: 2, price: 67.25 }], payment: "cartao",   fulfillment: "delivery", address: "Rua Sul, 321" },
  { id: "f6a7b8c9d0e1f6a7", total: 299.90, status: "entregue",   created_at: _d(3), items: [{ name: "Produto Top",      quantity: 1, price: 299.90 }], payment: "pix",     fulfillment: "delivery", address: "Av. Norte, 654" },
  { id: "a7b8c9d0e1f2a7b8", total: 44.90,  status: "entregue",   created_at: _d(4), items: [{ name: "Mini Kit",         quantity: 2, price: 22.45 }], payment: "pix",      fulfillment: "delivery", address: "Rua Leste, 987" },
  { id: "b8c9d0e1f2a3b8c9", total: 159.00, status: "aprovado",   created_at: _d(5), items: [{ name: "Produto Star",     quantity: 2, price: 79.50 }], payment: "cartao",   fulfillment: "delivery", address: "Av. Oeste, 147" },
  { id: "c9d0e1f2a3b4c9d0", total: 89.90,  status: "entregue",   created_at: _d(6), items: [{ name: "Essencial Pack",   quantity: 1, price: 89.90 }], payment: "pix",      fulfillment: "delivery", address: "Rua Central, 258" },
];

const DEMO_PRODUCTS: Product[] = [
  { id: "demo-prod-1", name: "Produto Premium",  price: 94.95,  image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=75", category: "Destaque"   },
  { id: "demo-prod-2", name: "Kit Completo",      price: 83.00,  image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=80&q=75", category: "Popular"    },
  { id: "demo-prod-3", name: "Produto Top",       price: 299.90, image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=80&q=75", category: "Premium"    },
  { id: "demo-prod-4", name: "Acessório Plus",    price: 67.25,  image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=80&q=75", category: "Acessórios" },
];
// ─────────────────────────────────────────────────────────────────────────────

const SellerDashboard = () => {
  const { user, isDemo } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [storeName, setStoreName]     = useState("");
  const [orders, setOrders]           = useState<Order[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    // Modo demonstração: usa dados mockados, pula Supabase
    if (isDemo) {
      setDisplayName("Marina Flores · Loja Demonstração");
      setStoreName("Loja Demonstração");
      setLoading(false);
      return;
    }
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
        setOrders((ordersData as unknown as Order[]) ?? []);
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
  }, [user?.id, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Em modo demo usa dados mockados; em modo real usa dados do banco (podem ser vazios)
  const displayOrders   = isDemo ? DEMO_ORDERS   : orders;
  const displayProducts = isDemo ? DEMO_PRODUCTS : products;

  // ── Cálculos de métricas ─────────────────────────────
  const todayStr = new Date().toDateString();

  const ordersToday = displayOrders.filter(
    (o) => new Date(o.created_at).toDateString() === todayStr
  );
  const totalToday = ordersToday.reduce((s, o) => s + o.total, 0);
  const inProgress = displayOrders.filter((o) => ["aprovado", "preparando", "saiu"].includes(o.status)).length;
  const done       = displayOrders.filter((o) => o.status === "entregue").length;

  const stats = [
    { label: "Vendas hoje",   value: `R$ ${totalToday.toFixed(2)}`, delta: `${ordersToday.length} pedido(s)`,                                                                                     icon: DollarSign,  accent: "text-primary",   bg: "bg-primary/10"   },
    { label: "Total pedidos", value: String(displayOrders.length),   delta: `${done} concluído(s)`,                                                                                               icon: TrendingUp,  accent: "text-secondary", bg: "bg-secondary/10" },
    { label: "Em andamento",  value: String(inProgress),             delta: "aguardando ação",                                                                                                    icon: Clock,       accent: "text-warning",   bg: "bg-warning/15"   },
    { label: "Concluídos",    value: String(done),                    delta: displayOrders.length ? `${Math.round((done / displayOrders.length) * 100)}% no prazo` : "–", icon: CheckCircle2, accent: "text-success", bg: "bg-success/15"   },
  ];

  // ── Gráfico de vendas — últimos 7 dias ───────────────
  const salesByDay: Record<string, number> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    salesByDay[d.toDateString()] = 0;
  }
  displayOrders.forEach((o) => {
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

  const recent = displayOrders.slice(0, 5);

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
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <FlaskConical className="w-3.5 h-3.5" /> Dados demonstrativos
            </span>
          )}
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
          <div className="space-y-3">
              {displayProducts.map((p, i) => (
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
