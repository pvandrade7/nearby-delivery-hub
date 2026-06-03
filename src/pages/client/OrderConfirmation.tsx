import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, Package, ChevronRight } from "lucide-react";
import type { FakeOrder } from "./Checkout";

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = (location.state as { order?: FakeOrder } | null)?.order;

  // Simulação de progressão de status
  const [statusIdx, setStatusIdx] = useState(0);
  const statuses = ["Pagamento aprovado", "Preparando pedido", "Aguardando entregador"];

  useEffect(() => {
    if (!order) return;
    const t = setInterval(() => {
      setStatusIdx((i) => (i < statuses.length - 1 ? i + 1 : i));
    }, 3500);
    return () => clearInterval(t);
  }, [order]);

  // Se chegou aqui sem estado, redireciona ao início
  if (!order) {
    return (
      <div className="px-4 py-16 max-w-md mx-auto text-center">
        <p className="text-muted-foreground mb-4">Nenhum pedido encontrado.</p>
        <Link to="/cliente/home" className="text-primary font-bold hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 max-w-lg mx-auto">

      {/* Ícone de sucesso */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full gradient-brand opacity-20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="size-24 rounded-full gradient-brand shadow-glow flex items-center justify-center relative">
            <CheckCircle2 className="w-12 h-12 text-primary-foreground" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold">Pedido confirmado!</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          Seu pedido foi enviado para a loja e está sendo preparado com carinho 🎉
        </p>
      </div>

      {/* Card principal */}
      <div className="bg-card rounded-2xl shadow-card p-5 space-y-4 mb-4">

        {/* Número e status */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground">Número do pedido</p>
            <p className="font-extrabold text-2xl text-primary">#{order.id}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-full">
              {statuses[statusIdx]}
            </span>
          </div>
        </div>

        {/* Tempo estimado */}
        <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
          <div className="size-9 rounded-lg bg-accent flex items-center justify-center text-primary shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tempo estimado</p>
            <p className="font-bold text-sm">
              {order.fulfillment === "Retirada"
                ? `${order.estimatedMin}–${order.estimatedMax} min para retirada`
                : `${order.estimatedMin}–${order.estimatedMax} min`}
            </p>
          </div>
        </div>

        {/* Itens */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Itens do pedido
          </p>
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                <span className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-border" />

        {/* Total */}
        <div className="flex justify-between font-extrabold">
          <span>Total pago</span>
          <span className="text-primary text-lg">R$ {order.total.toFixed(2)}</span>
        </div>

        {/* Pagamento e endereço */}
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="bg-muted rounded-xl p-3">
            <p className="font-bold text-foreground mb-0.5">Pagamento</p>
            <p>{order.payment}</p>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="font-bold text-foreground mb-0.5">Modalidade</p>
            <p>{order.fulfillment}</p>
          </div>
        </div>

        {order.address && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-xl p-3">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <span>{order.address}</span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="space-y-3">
        <Link
          to={`/cliente/rastreamento/${order.id}`}
          className="flex items-center justify-center gap-2 w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
        >
          Acompanhar entrega <ChevronRight className="w-4 h-4" />
        </Link>

        <Link
          to="/cliente/pedidos"
          className="flex items-center justify-center w-full border border-border rounded-xl py-3 font-bold text-sm hover:bg-muted/40 transition-colors"
        >
          Ver meus pedidos
        </Link>

        <Link
          to="/cliente/home"
          className="block text-center text-sm text-muted-foreground font-semibold hover:text-foreground py-2"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;
