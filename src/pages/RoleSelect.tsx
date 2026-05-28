import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Store, Bike, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/components/RequireRole";

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
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  // Usuário já autenticado com perfil definido → redireciona para a home do perfil.
  // Este redirect é da página INICIAL (/) e é intencional: o usuário estava logado
  // e abriu o app — faz sentido levá-lo direto para onde estava.
  // O redirect NÃO acontece nas páginas de login (AuthFlow), onde o usuário
  // deve clicar explicitamente para continuar.
  useEffect(() => {
    if (!loading && session && role) {
      navigate(HOME_BY_ROLE[role] ?? "/", { replace: true });
    }
  }, [loading, session, role, navigate]);

  // Enquanto carrega ou está prestes a redirecionar: mostra spinner
  if (loading || (session && role)) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <main className="min-h-dvh w-full gradient-warm flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center size-20 rounded-3xl gradient-brand shadow-glow mb-5">
            <span className="text-4xl font-extrabold text-primary-foreground">V+</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Vendy<span className="text-primary">+</span></h1>
          <p className="text-muted-foreground mt-2">Marketplace local. Entrega rápida.</p>
        </div>

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
                  Entrar <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Protótipo navegável • Vendy+ MVP
        </p>
      </div>
    </main>
  );
};

export default RoleSelect;
