import { Link } from "react-router-dom";
import { Lock, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
};

export const LoginGate = ({
  open,
  onClose,
  title = "Faça login para continuar",
  description = "Para esta ação você precisa estar conectado em sua conta.",
}: Props) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-elevated p-6 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="size-14 rounded-2xl gradient-brand flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <div className="mt-5 space-y-2">
          <Link
            to="/cliente"
            className="block text-center gradient-brand text-primary-foreground rounded-xl py-3 font-bold shadow-card"
          >
            Entrar ou criar conta
          </Link>
          <button onClick={onClose} className="w-full py-2 text-sm font-semibold text-muted-foreground">
            Continuar explorando
          </button>
        </div>
      </div>
    </div>
  );
};
