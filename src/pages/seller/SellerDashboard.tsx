import { Link } from "react-router-dom";
import { TrendingUp, Clock, CheckCircle2, Plus, DollarSign, Eye, BadgeCheck } from "lucide-react";
import { initialOrders, products } from "@/data/mockData";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const stats = [
  { label: "Vendas hoje", value: "R$ 487,30", delta: "+22% vs ontem", icon: DollarSign, accent: "text-primary", bg: "bg-primary/10" },
  { label: "Pedidos hoje", value: "14", delta: "+3 que ontem", icon: TrendingUp, accent: "text-secondary", bg: "bg-secondary/10" },
  { label: "Em andamento", value: "3", delta: "2 aguardando ação", icon: Clock, accent: "text-warning", bg: "bg-warning/15" },
  { label: "Concluídos", value: "11", delta: "92% no prazo", icon: CheckCircle2, accent: "text-success", bg: "bg-success/15" },
];

// Stylized weekly bar chart
const sales = [
  { d: "Seg", v: 280 },
  { d: "Ter", v: 340 },
  { d: "Qua", v: 410 },
  { d: "Qui", v: 360 },
  { d: "Sex", v: 520 },
  { d: "Sáb", v: 610 },
  { d: "Dom", v: 487 },
];

const SellerDashboard = () => {
  const recent = initialOrders.slice(0, 5);
  const top = products.filter((p) => p.storeId === "s3").slice(0, 4);
  const max = Math.max(...sales.map((s) => s.v));

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bom dia, Marina 🌸</p>
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

      {/* Charts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 lg:p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-base">Vendas da semana</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 7 dias</p>
            </div>
            <span className="text-sm font-extrabold text-primary">R$ 3.007,00</span>
          </div>
          <div className="h-56 flex items-end gap-3 lg:gap-5">
            {sales.map((s) => {
              const h = Math.round((s.v / max) * 100);
              const today = s.d === "Dom";
              return (
                <div key={s.d} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg ${today ? "gradient-brand" : "bg-accent"}`}
                      style={{ height: `${h}%` }}
                      title={`R$ ${s.v}`}
                    />
                  </div>
                  <span className={`text-[11px] font-bold ${today ? "text-primary" : "text-muted-foreground"}`}>
                    {s.d}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-base mb-4">Produtos mais vendidos</h2>
          <div className="space-y-3">
            {top.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-muted-foreground w-4">{i + 1}</span>
                <img src={p.image} alt="" className="size-10 rounded-lg object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)}</p>
                </div>
                <span className="text-xs font-bold text-success">+{12 - i * 2}</span>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-bold px-5 lg:px-6 py-3">Pedido</th>
                <th className="text-left font-bold px-3 py-3">Cliente</th>
                <th className="text-left font-bold px-3 py-3 hidden md:table-cell">Itens</th>
                <th className="text-left font-bold px-3 py-3">Status</th>
                <th className="text-right font-bold px-3 py-3">Total</th>
                <th className="text-right font-bold px-5 lg:px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 lg:px-6 py-3 font-bold">{o.id}</td>
                  <td className="px-3 py-3">{o.customer}</td>
                  <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{o.items.length} item(ns)</td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        o.status === "entregue"
                          ? "bg-success/15 text-success"
                          : o.status === "saiu"
                          ? "bg-primary/15 text-primary"
                          : "bg-warning/20 text-warning-foreground"
                      }`}
                    >
                      {o.status === "preparando" ? "Em preparação" : o.status === "saiu" ? "Saiu p/ entrega" : o.status === "entregue" ? "Entregue" : "Confirmado"}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-extrabold text-primary text-right">R$ {o.total.toFixed(2)}</td>
                  <td className="px-5 lg:px-6 py-3 text-right">
                    <Link
                      to="/lojista/pedidos"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
