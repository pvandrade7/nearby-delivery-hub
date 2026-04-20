import { Link } from "react-router-dom";
import { Check, Wallet } from "lucide-react";

const CourierComplete = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="size-24 rounded-full gradient-brand shadow-glow flex items-center justify-center animate-scale-in">
        <Check className="w-12 h-12 text-primary-foreground" strokeWidth={3} />
      </div>
      <h1 className="text-2xl font-extrabold mt-6">Entrega finalizada! 🎉</h1>
      <p className="text-sm text-muted-foreground mt-2">Boa entrega, Carlos. O valor já caiu na sua carteira.</p>

      <div className="bg-card rounded-2xl p-5 shadow-card mt-8 w-full max-w-xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs text-muted-foreground">Você ganhou</p>
            <p className="text-xl font-extrabold text-primary">+ R$ 12,50</p>
          </div>
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Saldo total</span>
          <span className="font-bold">R$ 155,30</span>
        </div>
      </div>

      <Link
        to="/entregador"
        className="mt-8 w-full max-w-xs gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated"
      >
        Ver mais corridas
      </Link>
    </div>
  );
};

export default CourierComplete;
