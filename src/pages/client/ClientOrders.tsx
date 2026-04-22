import { Link } from "react-router-dom";

const orders = [
  { id: "#1043", store: "Padaria Sabor Real", status: "saiu", total: 32.5, time: "há 8 min" },
  { id: "#1039", store: "Empório Alvorada", status: "entregue", total: 78.9, time: "ontem" },
  { id: "#1037", store: "Quitanda da Vila", status: "entregue", total: 45.2, time: "3 dias" },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  preparando: { label: "Em preparação", color: "bg-warning/20 text-warning-foreground" },
  saiu: { label: "Saiu p/ entrega", color: "bg-primary/15 text-primary" },
  entregue: { label: "Entregue", color: "bg-success/15 text-success" },
};

const ClientOrders = () => {
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Meus pedidos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((o) => {
          const s = statusLabels[o.status];
          return (
            <Link
              key={o.id}
              to={`/cliente/rastreamento/${o.id.replace("#", "")}`}
              className="block bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">{o.id}</p>
                  <p className="font-bold text-base">{o.store}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${s.color}`}>{s.label}</span>
              </div>
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                <span>{o.time}</span>
                <span className="font-extrabold text-primary text-base">R$ {o.total.toFixed(2)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ClientOrders;
