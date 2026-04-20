import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { SellerTabBar } from "@/components/SellerTabBar";
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
  saiu: "bg-primary/20 text-primary",
  entregue: "bg-success/20 text-success",
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Pedidos" />
      <div className="px-5 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide border-b border-border">
        {(["all", "preparando", "saiu", "entregue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              filter === f ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all" ? "Todos" : f === "preparando" ? "Em preparação" : f === "saiu" ? "Saiu p/ entrega" : "Entregues"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-3">
        {visible.map((o) => (
          <div key={o.id} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">{o.id} • {o.createdAt}</p>
                <p className="font-bold text-sm">{o.customer}</p>
                <p className="text-xs text-muted-foreground">{o.address}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${badgeColors[o.status]}`}>
                {o.status === "preparando" ? "Em preparação" : o.status === "saiu" ? "Saiu p/ entrega" : o.status === "entregue" ? "Entregue" : "Confirmado"}
              </span>
            </div>

            <div className="bg-muted/50 rounded-xl p-2.5 mt-3 space-y-1">
              {o.items.map((i) => (
                <div key={i.productId} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{i.quantity}x {i.name}</span>
                  <span className="font-semibold">R$ {(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-3">
              <span className="font-extrabold text-primary">R$ {o.total.toFixed(2)}</span>
              {o.status !== "entregue" && (
                <button
                  onClick={() => advance(o.id)}
                  className="gradient-brand text-primary-foreground px-4 py-2 rounded-full text-xs font-bold shadow-card"
                >
                  {statusLabels[o.status]}
                </button>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhum pedido aqui ainda.</p>
        )}
      </div>

      <SellerTabBar />
    </div>
  );
};

export default SellerOrders;
