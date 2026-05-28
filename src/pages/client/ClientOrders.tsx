import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { ORDERS_KEY, type FakeOrder } from "./Checkout";

// Pedidos mockados que aparecem por padrão na primeira visita
const SEED_ORDERS: FakeOrder[] = [
  {
    id: "1039",
    storeName: "Empório Alvorada",
    items: [
      { name: "Arroz Tio João 5kg", quantity: 2, price: 24.9 },
      { name: "Feijão Carioca 1kg", quantity: 1, price: 8.9 },
    ],
    total: 78.9,
    address: "Rua das Flores, 200 — Apto 42",
    payment: "Pix",
    fulfillment: "Entrega",
    status: "entregue",
    createdAt: Date.now() - 86_400_000,
    estimatedMin: 25,
    estimatedMax: 40,
  },
  {
    id: "1037",
    storeName: "Quitanda da Vila",
    items: [
      { name: "Tomate (kg)", quantity: 2, price: 7.9 },
      { name: "Banana-prata (kg)", quantity: 3, price: 5.9 },
    ],
    total: 45.2,
    address: "Rua das Flores, 200 — Apto 42",
    payment: "Dinheiro",
    fulfillment: "Entrega",
    status: "entregue",
    createdAt: Date.now() - 259_200_000,
    estimatedMin: 20,
    estimatedMax: 35,
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  aprovado:   { label: "Pagamento aprovado",   color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  preparando: { label: "Preparando pedido",     color: "bg-warning/20 text-warning-foreground" },
  saiu:       { label: "Saiu p/ entrega",       color: "bg-primary/15 text-primary" },
  entregue:   { label: "Entregue",              color: "bg-success/15 text-success" },
};

const timeAgo = (ms: number) => {
  const diff = Date.now() - ms;
  if (diff < 60_000)        return "agora mesmo";
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)} min atrás`;
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)} h atrás`;
  if (diff < 172_800_000)   return "ontem";
  return `${Math.floor(diff / 86_400_000)} dias atrás`;
};

const loadOrders = (): FakeOrder[] => {
  try {
    const stored: FakeOrder[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    if (stored.length > 0) return stored;
  } catch { /* silent */ }
  // Primeira visita: salva seeds e retorna
  localStorage.setItem(ORDERS_KEY, JSON.stringify(SEED_ORDERS));
  return SEED_ORDERS;
};

export default function ClientOrders() {
  const [orders, setOrders] = useState<FakeOrder[]>([]);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  // Simula progressão automática de status dos pedidos recentes
  useEffect(() => {
    const STATUS_SEQ: FakeOrder["status"][] = ["aprovado", "preparando", "saiu", "entregue"];
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.status === "entregue") return o;
          const idx = STATUS_SEQ.indexOf(o.status);
          const next = STATUS_SEQ[idx + 1] ?? o.status;
          const updated = { ...o, status: next };
          // Persiste o novo status
          const all: FakeOrder[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
          localStorage.setItem(
            ORDERS_KEY,
            JSON.stringify(all.map((x) => (x.id === o.id ? updated : x))),
          );
          return updated;
        }),
      );
    }, 12_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Meus pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum pedido ainda</p>
          <p className="text-sm mt-1">Seus pedidos aparecerão aqui após a confirmação</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((o) => {
            const s = statusConfig[o.status] ?? statusConfig.aprovado;
            return (
              <Link
                key={o.id}
                to={`/cliente/rastreamento/${o.id}`}
                className="block bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">#{o.id}</p>
                    <p className="font-bold text-base">{o.storeName}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ml-2 ${s.color}`}>
                    {s.label}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {o.items.slice(0, 2).map((item, i) => (
                    <span key={i}>
                      {item.quantity}× {item.name}
                      {i < Math.min(o.items.length, 2) - 1 ? ", " : ""}
                    </span>
                  ))}
                  {o.items.length > 2 && ` +${o.items.length - 2} itens`}
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{timeAgo(o.createdAt)}</span>
                  <span className="font-extrabold text-primary text-base">
                    R$ {o.total.toFixed(2)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
