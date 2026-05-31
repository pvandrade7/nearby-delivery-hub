import { Link } from "react-router-dom";
import { ShoppingBag, Store, Bike, ArrowRight, Heart, TrendingUp, Users } from "lucide-react";

const stats = [
  { icon: Store,      value: "14+", label: "negócios locais" },
  { icon: Users,      value: "100%", label: "empreendedores reais" },
  { icon: TrendingUp, value: "FOR", label: "Fortaleza-CE" },
];

const roles = [
  {
    to: "/cliente",
    icon: ShoppingBag,
    title: "Sou Cliente",
    desc: "Compre de microempreendedores e pequenas lojas da sua cidade",
    bg: "bg-gradient-to-br from-primary to-primary-glow",
  },
  {
    to: "/lojista",
    icon: Store,
    title: "Sou Lojista",
    desc: "Cadastre seu negócio local e venda para clientes da sua região",
    bg: "bg-gradient-to-br from-secondary to-primary",
  },
  {
    to: "/entregador",
    icon: Bike,
    title: "Sou Entregador",
    desc: "Faça entregas para o comércio local e ganhe dinheiro",
    bg: "bg-gradient-to-br from-warning to-primary",
  },
];

const RoleSelect = () => {
  return (
    <main className="min-h-dvh w-full gradient-warm flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">

        {/* Logo + Tagline */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center size-20 rounded-3xl gradient-brand shadow-glow mb-5">
            <span className="text-4xl font-extrabold text-primary-foreground">V+</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Vendy<span className="text-primary">+</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            O marketplace que fortalece o comércio local.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-primary font-semibold">
            <Heart className="w-4 h-4 fill-primary" />
            Feito para microempreendedores e pequenos negócios
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up">
          {stats.map((s) => (
            <div key={s.label} className="bg-card/80 backdrop-blur rounded-2xl px-3 py-3 text-center shadow-card">
              <p className="text-xl font-extrabold text-primary">{s.value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Cards de acesso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((r, i) => (
            <Link
              key={r.to}
              to={r.to}
              className="block animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`${r.bg} rounded-2xl p-6 text-primary-foreground shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all h-full flex flex-col`}>
                <div className="size-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                  <r.icon className="w-7 h-7" />
                </div>
                <h2 className="font-extrabold text-lg leading-tight">{r.title}</h2>
                <p className="text-sm text-white/85 mt-1 flex-1">{r.desc}</p>
                <div className="flex items-center gap-1 text-sm font-bold mt-4">
                  Começar <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Vendy+ • Fortalecendo o comércio local de Fortaleza-CE
        </p>
      </div>
    </main>
  );
};

export default RoleSelect;
