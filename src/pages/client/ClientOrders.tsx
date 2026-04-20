import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { ClientTabBar } from "@/components/ClientTabBar";

const orders = [
  { id: "#1043", store: "Padaria Sabor Real", status: "saiu", total: 32.5, time: "há 8 min" },
  { id: "#1039", store: "Empório Alvorada", status: "entregue", total: 78.9, time: "ontem" },
  { id: "#1037", store: "Quitanda da Vila", status: "entregue", total: 45.2, time: "3 dias" },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  preparando: { label: "Em preparação", color: "bg-warning/20 text-warning-foreground" },
  saiu: { label: "Saiu p/ entrega", color: "bg-primary/20 text-primary" },
  entregue: { label: "Entregue", color: "bg-success/20 text-success" },
};

const ClientOrders = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Meus pedidos" />
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-3">
        {orders.map((o) => {
          const s = statusLabels[o.status];
          return (
            <Link
              key={o.id}
              to={`/cliente/rastreamento/${o.id.replace("#", "")}`}
              className="block bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">{o.id}</p>
                  <p className="font-bold text-sm">{o.store}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${s.color}`}>{s.label}</span>
              </div>
              <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                <span>{o.time}</span>
                <span className="font-bold text-primary text-sm">R$ {o.total.toFixed(2)}</span>
              </div>
            </Link>
          );
        })}
      </div>
      <ClientTabBar />
    </div>
  );
};

export default ClientOrders;
