import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ORDERS_KEY, type FakeOrder } from "./Checkout";

const statusConfig: Record<string, { label: string; color: string }> = {
  aprovado:   { label: "Pagamento aprovado",   color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  preparando: { label: "Preparando pedido",     color: "bg-warning/20 text-warning-foreground" },
  saiu:       { label: "Saiu p/ entrega",       color: "bg-primary/15 text-primary" },
  entregue:   { label: "Entregue",              color: "bg-success/15 text-success" },
};

const timeAgo = (dateStr: string | number) => {
  const ms = typeof dateStr === "number" ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - ms;
  if (diff < 60_000)        return "agora mesmo";
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)} min atrás`;
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)} h atrás`;
  if (diff < 172_800_000)   return "ontem";
  return `${Math.floor(diff / 86_400_000)} dias atrás`;
};

type DbOrder = {
  id: string;
  store_name: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  address: string | null;
  payment: string;
  fulfillment: string;
  status: string;
  created_at: string;
  estimated_min: number;
  estimated_max: number;
};

// Pedidos de demonstração — aparecem apenas se o usuário não tiver pedidos no banco
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

export default function ClientOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<FakeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (user) {
        // Carrega pedidos reais do Supabase
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: FakeOrder[] = (data as DbOrder[]).map((o) => ({
            id: o.id,
            storeName: o.store_name,
            items: Array.isArray(o.items) ? o.items : [],
            total: o.total,
            address: o.address ?? "",
            payment: o.payment,
            fulfillment: o.fulfillment,
            status: o.status as FakeOrder["status"],
            createdAt: new Date(o.created_at).getTime(),
            estimatedMin: o.estimated_min ?? 25,
            estimatedMax: o.estimated_max ?? 40,
          }));
          setOrders(mapped);
          setLoading(false);
          return;
        }
      }
    } catch { /* fallback abaixo */ }

    // Fallback: tenta localStorage (pedidos feitos antes da migração)
    try {
      const stored: FakeOrder[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      if (stored.length > 0) {
        setOrders(stored);
        setLoading(false);
        return;
      }
    } catch { /* silent */ }

    // Última opção: pedidos de demonstração
    localStorage.setItem(ORDERS_KEY, JSON.stringify(SEED_ORDERS));
    setOrders(SEED_ORDERS);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Realtime: atualiza status quando o lojista muda
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("client-orders-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `buyer_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as DbOrder;
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id
                ? { ...o, status: updated.status as FakeOrder["status"] }
                : o
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-extrabold">Meus pedidos</h1>
        <button
          onClick={loadOrders}
          className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
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
                    <p className="text-xs text-muted-foreground">#{typeof o.id === "string" && o.id.length > 8 ? o.id.slice(0, 8) + "…" : o.id}</p>
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
