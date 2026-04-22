import { Link } from "react-router-dom";
import { ChevronRight, MapPin, CreditCard, Heart, HelpCircle, LogOut, RefreshCw } from "lucide-react";

const items = [
  { icon: MapPin, label: "Endereços salvos" },
  { icon: CreditCard, label: "Formas de pagamento" },
  { icon: Heart, label: "Favoritos" },
  { icon: HelpCircle, label: "Ajuda" },
];

const ClientProfile = () => {
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Meu perfil</h1>

      <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4">
        <div className="size-16 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-extrabold text-xl">J</div>
        <div className="flex-1">
          <p className="font-bold text-lg">João Souza</p>
          <p className="text-sm text-muted-foreground">+55 11 9 9999-1234</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl mt-4 shadow-card overflow-hidden">
        {items.map((it) => (
          <button key={it.label} className="w-full px-5 py-4 flex items-center gap-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
            <it.icon className="w-5 h-5 text-primary" />
            <span className="flex-1 text-left text-sm font-semibold">{it.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <Link to="/" className="bg-card rounded-2xl mt-4 shadow-card overflow-hidden block hover:bg-muted/40 transition-colors">
        <div className="w-full px-5 py-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-secondary" />
          <span className="flex-1 text-left text-sm font-semibold">Trocar de perfil</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Link>

      <button className="w-full mt-4 py-3 text-destructive font-semibold text-sm flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </div>
  );
};

export default ClientProfile;
