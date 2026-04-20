import { Link } from "react-router-dom";
import { TrendingUp, Clock, CheckCircle2, Plus, Bell } from "lucide-react";
import { SellerTabBar } from "@/components/SellerTabBar";
import { initialOrders } from "@/data/mockData";

const stats = [
  { label: "Pedidos hoje", value: "14", icon: TrendingUp, gradient: "gradient-brand" },
  { label: "Em andamento", value: "3", icon: Clock, color: "bg-warning text-warning-foreground" },
  { label: "Concluídos", value: "11", icon: CheckCircle2, color: "bg-success text-success-foreground" },
];

const SellerDashboard = () => {
  const recent = initialOrders.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="gradient-sunset text-primary-foreground px-5 pt-6 pb-8 rounded-b-[2rem]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs opacity-80 font-semibold uppercase tracking-wider">Bom dia,</p>
            <h1 className="text-xl font-extrabold">Marina 🌸</h1>
          </div>
          <button className="size-10 rounded-full bg-white/25 backdrop-blur flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-warning" />
          </button>
        </div>

        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 mt-5">
          <p className="text-xs opacity-90 font-semibold">VENDAS DE HOJE</p>
          <p className="text-3xl font-extrabold mt-1">R$ 487,30</p>
          <p className="text-xs opacity-90 mt-1">↑ 22% vs ontem</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-5 pb-2 space-y-5">
        <section>
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="bg-card rounded-2xl p-3 shadow-card">
                <div className={`size-8 rounded-lg flex items-center justify-center mb-2 ${s.gradient ?? s.color} ${s.gradient ? "text-primary-foreground" : ""}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-extrabold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <Link
          to="/lojista/produtos/novo"
          className="flex items-center justify-center gap-2 gradient-brand text-primary-foreground rounded-2xl py-3.5 font-bold shadow-card"
        >
          <Plus className="w-4 h-4" /> Cadastrar novo produto
        </Link>

        <section>
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="font-bold">Pedidos recentes</h2>
            <Link to="/lojista/pedidos" className="text-xs text-primary font-semibold">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {recent.map((o) => (
              <Link key={o.id} to="/lojista/pedidos" className="block bg-card rounded-2xl p-3 shadow-card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">{o.id} • {o.createdAt}</p>
                    <p className="font-bold text-sm">{o.customer}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{o.items.length} item(ns)</p>
                  </div>
                  <p className="font-extrabold text-primary text-sm">R$ {o.total.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SellerTabBar />
    </div>
  );
};

export default SellerDashboard;
