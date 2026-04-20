import { Link } from "react-router-dom";
import { ShoppingBag, Store, Bike, ArrowRight } from "lucide-react";

const roles = [
  {
    to: "/cliente",
    icon: ShoppingBag,
    title: "Sou Cliente",
    desc: "Quero comprar das lojas do meu bairro",
    bg: "bg-gradient-to-br from-primary to-primary-glow",
  },
  {
    to: "/lojista",
    icon: Store,
    title: "Sou Lojista",
    desc: "Quero vender meus produtos online",
    bg: "bg-gradient-to-br from-secondary to-primary",
  },
  {
    to: "/entregador",
    icon: Bike,
    title: "Sou Entregador",
    desc: "Quero fazer entregas e ganhar dinheiro",
    bg: "bg-gradient-to-br from-warning to-primary",
  },
];

const RoleSelect = () => {
  return (
    <main className="flex-1 px-6 py-10 flex flex-col">
      <div className="text-center mb-10 animate-slide-up">
        <div className="inline-flex items-center justify-center size-20 rounded-3xl gradient-brand shadow-glow mb-5">
          <span className="text-4xl font-extrabold text-primary-foreground">V+</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Vendy<span className="text-primary">+</span></h1>
        <p className="text-muted-foreground mt-2 text-sm">Compre do bairro. Entrega rápida.</p>
      </div>

      <div className="space-y-3 flex-1">
        {roles.map((r, i) => (
          <Link
            key={r.to}
            to={r.to}
            className="block animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`${r.bg} rounded-2xl p-5 text-primary-foreground shadow-card flex items-center gap-4 active:scale-[0.98] transition-transform`}>
              <div className="size-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <r.icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg leading-tight">{r.title}</h2>
                <p className="text-sm text-white/85">{r.desc}</p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Protótipo navegável • Vendy+ MVP
      </p>
    </main>
  );
};

export default RoleSelect;
