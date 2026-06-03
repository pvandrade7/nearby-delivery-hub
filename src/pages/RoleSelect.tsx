import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Store, Bike, ArrowRight, Heart, FlaskConical } from "lucide-react";

const stats = [
  { value: "14+",    label: "negócios locais"     },
  { value: "100%",   label: "empreendedores reais" },
  { value: "Grátis", label: "sem taxas extras"    },
];

const roles = [
  {
    to:           "/cliente",
    icon:         ShoppingBag,
    title:        "Sou Cliente",
    desc:         "Compre de microempreendedores e pequenas lojas da sua cidade",
    bg:           "bg-gradient-to-br from-primary to-primary-glow",
    mobileOnly:   false,
  },
  {
    to:           "/lojista",
    icon:         Store,
    title:        "Sou Lojista",
    desc:         "Cadastre seu negócio local e venda para clientes da sua região",
    bg:           "bg-gradient-to-br from-secondary to-primary",
    mobileOnly:   false,
  },
  {
    to:           "/entregador",
    icon:         Bike,
    title:        "Sou Entregador",
    desc:         "Faça entregas para o comércio local e ganhe dinheiro",
    bg:           "bg-gradient-to-br from-warning to-primary",
    mobileOnly:   true,   // ← oculto no desktop, visível apenas no mobile
  },
];

const RoleSelect = () => {
  const navigate = useNavigate();
  const [showDemoTip, setShowDemoTip] = useState(false);

  return (
    <main className="min-h-dvh w-full gradient-warm flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl">

        {/* ── Logo + Tagline ─────────────────────────────── */}
        <div className="text-center mb-5 sm:mb-8 animate-slide-up">
          {/* Ícone menor no mobile */}
          <div className="inline-flex items-center justify-center size-14 sm:size-20 rounded-2xl sm:rounded-3xl gradient-brand shadow-glow mb-3 sm:mb-5">
            <span className="text-2xl sm:text-4xl font-extrabold text-primary-foreground">V+</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Vendy<span className="text-primary">+</span>
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            O marketplace que fortalece o comércio local.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2 sm:mt-3 text-xs sm:text-sm text-primary font-semibold">
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-primary" />
            Feito para microempreendedores e pequenos negócios
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-8 animate-slide-up">
          {stats.map((s) => (
            <div key={s.label} className="bg-card/80 backdrop-blur rounded-xl sm:rounded-2xl px-2 sm:px-3 py-2 sm:py-3 text-center shadow-card">
              <p className="text-base sm:text-xl font-extrabold text-primary">{s.value}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Cards de acesso ────────────────────────────── */}
        {/* Desktop: 2 colunas (Cliente + Lojista); mobile: 1 coluna com os 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
          {roles.map((r, i) => (
            <Link
              key={r.to}
              to={r.to}
              className={`block animate-slide-up ${r.mobileOnly ? "md:hidden" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/*
               * Mobile  → flex-row: ícone | texto | seta  (compact horizontal)
               * Desktop → flex-col: ícone acima, texto, botão embaixo  (original)
               */}
              <div className={`
                ${r.bg} rounded-2xl shadow-card text-primary-foreground transition-all
                active:scale-[0.98] hover:shadow-elevated hover:-translate-y-0.5
                flex flex-row items-center gap-3 p-3.5
                md:flex-col md:items-start md:gap-0 md:p-6 md:h-full
              `}>

                {/* Ícone */}
                <div className="
                  size-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0
                  md:size-14 md:rounded-2xl md:mb-4
                ">
                  <r.icon className="w-5 h-5 md:w-7 md:h-7" />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-extrabold text-sm md:text-lg leading-tight">{r.title}</h2>
                  <p className="text-[11px] md:text-sm text-white/85 mt-0.5 md:mt-1 leading-snug md:flex-1">
                    {r.desc}
                  </p>
                </div>

                {/* Ação */}
                <div className="flex items-center gap-1 font-bold shrink-0 md:mt-4 md:self-start md:text-sm">
                  <span className="hidden md:inline text-sm">Começar </span>
                  <ArrowRight className="w-4 h-4" />
                </div>

              </div>
            </Link>
          ))}
        </div>

        {/* ── Modo Demonstração ─────────────────────────── */}
        <div className="mt-6 sm:mt-10 text-center">
          <p className="text-xs text-muted-foreground mb-2 sm:mb-3">
            Vendy+ • Fortalecendo o comércio local
          </p>
          <button
            onClick={() => setShowDemoTip((v) => !v)}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
          >
            Modo demonstração (apresentação)
          </button>

          {showDemoTip && (
            <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-4 text-left max-w-sm mx-auto">
              <div className="flex items-start gap-2.5">
                <FlaskConical className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                    Modo Demonstração
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mb-2">
                    Acesse como lojista com dados fictícios para explorar todas as funcionalidades.
                  </p>
                  <div className="text-xs text-amber-700 dark:text-amber-400 mb-3 space-y-0.5">
                    <p>E-mail: <span className="font-bold">demo@gmail.com</span></p>
                    <p>Senha: <span className="font-bold">202020</span></p>
                  </div>
                  <button
                    onClick={() => navigate("/lojista", { replace: false })}
                    className="inline-flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-amber-600 transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    Ir para login do Lojista
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default RoleSelect;
