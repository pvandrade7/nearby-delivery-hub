import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const OrderConfirmation = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="size-24 rounded-full gradient-brand shadow-glow flex items-center justify-center animate-scale-in">
        <Check className="w-12 h-12 text-primary-foreground" strokeWidth={3} />
      </div>
      <h1 className="text-2xl font-extrabold mt-6 animate-slide-up">Pedido confirmado! 🎉</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs animate-slide-up">
        Seu pedido foi enviado para a loja. Você será avisado a cada atualização.
      </p>
      <div className="bg-card rounded-2xl p-4 shadow-card mt-8 w-full max-w-xs text-left animate-slide-up">
        <p className="text-xs text-muted-foreground">Número do pedido</p>
        <p className="font-bold text-lg">#1043</p>
        <p className="text-xs text-muted-foreground mt-2">Tempo estimado</p>
        <p className="font-bold text-lg text-primary">25 — 35 min</p>
      </div>

      <Link
        to="/cliente/rastreamento/1043"
        className="mt-8 w-full max-w-xs gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated"
      >
        Acompanhar entrega
      </Link>
      <Link to="/cliente" className="text-sm text-muted-foreground mt-3 font-semibold">
        Voltar ao início
      </Link>
    </div>
  );
};

export default OrderConfirmation;
