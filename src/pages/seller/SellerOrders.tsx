import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShoppingBag, RefreshCw } from "lucide-react";

type OrderStatus = "aprovado" | "preparando" | "saiu" | "entregue";

type Order = {
  id: string;
  store_name: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  address: string | null;
  payment: string;
  fulfillment: string;
  status: OrderStatus;
  created_at: string;
};

import { DEMO_ORDERS as _DEMO_ORDERS, DEMO_STORE } from "@/data/demoData";

// Adapta DemoOrder para o tipo Order desta página
const DEMO_ORDERS: Order[] = _DEMO_ORDERS.map((o) => ({
  id:           o.id,
  store_name:   DEMO_STORE.storeName,
  items:        o.items,
  total:        o.total,
  address:      o.address,
  payment:      o.payment === "pix" ? "PIX" : o.payment === "cartao" ? "Cartão" : "Dinheiro",
  fulfillment:  o.fulfillment,
  status:       (o.status === "cancelado" ? "aprovado" : o.status) as OrderStatus,
  created_at:   o.created_at,
}));

const statusFlow: OrderStatus[] = ["aprovado", "preparando", "saiu", "entregue"];

const statusLabels: Record<OrderStatus, string> = {
  aprovado:   "Confirmar",
  preparando: "Despachar",
  saiu:       "Finalizar",
  entregue:   "Entregue",
};

const badgeColors: Record<OrderStatus, string> = {
  aprovado:   "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  preparando: "bg-warning/20 text-warning-foreground",
  saiu:       "bg-primary/15 text-primary",
  entregue:   "bg-success/15 text-success",
};

const badgeLabels: Record<OrderStatus, string> = {
  aprovado:   "Pagamento aprovado",
  preparando: "Em preparação",
  saiu:       "Saiu p/ entrega",
  entregue:   "Entregue",
};

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

const SellerOrders = () => {
  const { user, isDemo } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);

  // Modo demonstração: carrega dados mockados sem tocar no Supabase
  useEffect(() => {
    if (!isDemo) return;
    setOrders(DEMO_ORDERS);
    setStoreName("Loja Demonstração");
    setLoading(false);
  }, [isDemo]);

  // Busca o nome da loja do perfil do lojista
  useEffect(() => {
    if (isDemo || !user) return;
    supabase
      .from("profiles")
      .select("extras")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const ext = data?.extras as Record<string, string> | null;
        setStoreName(ext?.storeName ?? null);
      });
  }, [user?.id, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrders = async () => {
    if (isDemo || !storeName) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_name", storeName)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
    } else {
      setOrders((data as Order[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { if (!isDemo && storeName !== null) loadOrders(); }, [storeName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: novos pedidos chegam automaticamente (apenas modo real)
  useEffect(() => {
    if (isDemo || !storeName) return;
    const channel = supabase
      .channel("seller-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as Order;
          if (newOrder.store_name === storeName) {
            setOrders((prev) => [newOrder, ...prev]);
            toast.success(`Novo pedido recebido! R$ ${newOrder.total.toFixed(2)}`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeName, isDemo]);

  const advance = async (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const idx = statusFlow.indexOf(order.status);
    if (idx >= statusFlow.length - 1) return;
    const next = statusFlow[idx + 1];

    setAdvancing(id);

    if (isDemo) {
      // Modo demo: atualiza apenas o estado local
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: next } : o));
      toast.success(`Pedido ${badgeLabels[next].toLowerCase()}!`);
      setAdvancing(null);
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar pedido");
    } else {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: next } : o));
      toast.success(`Pedido ${badgeLabels[next].toLowerCase()}!`);
    }
    setAdvancing(null);
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl lg:text-3xl font-extrabold">Pedidos</h1>
        <button
          onClick={loadOrders}
          className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Gerencie e atualize o status dos seus pedidos</p>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
        {(["all", "aprovado", "preparando", "saiu", "entregue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              filter === f ? "gradient-brand text-primary-foreground shadow-card" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "all" ? "Todos" :
             f === "aprovado" ? "Aprovados" :
             f === "preparando" ? "Em preparação" :
             f === "saiu" ? "Saiu p/ entrega" : "Entregues"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((o) => (
            <div key={o.id} className="bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} • {formatDate(o.created_at)}</p>
                  <p className="font-bold text-base">{o.payment} · {o.fulfillment}</p>
                  <p className="text-xs text-muted-foreground">{o.address || "Retirada"}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ml-2 ${badgeColors[o.status]}`}>
                  {badgeLabels[o.status]}
                </span>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 mt-4 space-y-1">
                {Array.isArray(o.items) && o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
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
                    disabled={advancing === o.id}
                    className="gradient-brand text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-60"
                  >
                    {advancing === o.id ? "..." : statusLabels[o.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
          {visible.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">
                {storeName
                  ? "Nenhum pedido aqui ainda."
                  : "Configure o nome da sua loja primeiro em Configurações."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
