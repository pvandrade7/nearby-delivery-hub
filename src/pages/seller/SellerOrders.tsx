import { useState } from "react";
import { initialOrders, OrderStatus } from "@/data/mockData";

const statusFlow: OrderStatus[] = ["confirmado", "preparando", "saiu", "entregue"];
const statusLabels: Record<OrderStatus, string> = {
  confirmado: "Confirmar",
  preparando: "Preparar",
  saiu: "Despachar",
  entregue: "Entregue",
};
const badgeColors: Record<OrderStatus, string> = {
  confirmado: "bg-accent text-accent-foreground",
  preparando: "bg-warning/20 text-warning-foreground",
  saiu: "bg-primary/15 text-primary",
  entregue: "bg-success/15 text-success",
};

const SellerOrders = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const advance = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const idx = statusFlow.indexOf(o.status);
        const next = statusFlow[Math.min(idx + 1, statusFlow.length - 1)];
        return { ...o, status: next };
      })
    );
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">Pedidos</h1>
      <p className="text-sm text-muted-foreground mb-6">Gerencie e atualize o status dos seus pedidos</p>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
        {(["all", "preparando", "saiu", "entregue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              filter === f ? "gradient-brand text-primary-foreground shadow-card" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "all" ? "Todos" : f === "preparando" ? "Em preparação" : f === "saiu" ? "Saiu p/ entrega" : "Entregues"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((o) => (
          <div key={o.id} className="bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">{o.id} • {o.createdAt}</p>
                <p className="font-bold text-base">{o.customer}</p>
                <p className="text-xs text-muted-foreground">{o.address}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${badgeColors[o.status]}`}>
                {o.status === "preparando" ? "Em preparação" : o.status === "saiu" ? "Saiu p/ entrega" : o.status === "entregue" ? "Entregue" : "Confirmado"}
              </span>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 mt-4 space-y-1">
              {o.items.map((i) => (
                <div key={i.productId} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{i.quantity}x {i.name}</span>
                  <span className="font-semibold">R$ {(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="font-extrabold text-primary text-lg">R$ {o.total.toFixed(2)}</span>
              {o.status !== "entregue" && (
                <button
                  onClick={() => advance(o.id)}
                  className="gradient-brand text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold shadow-card hover:shadow-elevated transition-shadow"
                >
                  {statusLabels[o.status]}
                </button>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">Nenhum pedido aqui ainda.</p>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
