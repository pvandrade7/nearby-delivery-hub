import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Step 1 (Criar conta) é sempre o AuthFlow em /lojista — já concluído
// quando o usuário está neste layout.
// Step 2 → /lojista/criar-loja
// Step 3 → /lojista/verificacao
const STEPS = [
  { n: 1, label: "Criar conta" },
  { n: 2, label: "Configurar loja" },
  { n: 3, label: "Verificação" },
] as const;

type Step = 1 | 2 | 3;

type Props = {
  children: ReactNode;
  /** Etapa atual (1 = criar conta, 2 = configurar loja, 3 = verificação) */
  step: Step;
};

export const OnboardingLayout = ({ children, step }: Props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/lojista", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-muted/30 flex flex-col">
      {/* ── Header limpo — sem sidebar, sem navegação do marketplace ── */}
      <header className="sticky top-0 z-30 bg-card border-b border-border h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-glow">
            V+
          </div>
          <span className="font-extrabold text-base hidden sm:block">
            Vendy<span className="text-primary">+</span>
          </span>
        </Link>

        {/* Indicador de progresso */}
        <ol className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const done   = s.n < step;
            const active = s.n === step;
            return (
              <li key={s.n} className="flex items-center gap-1 sm:gap-2">
                {/* Conector */}
                {i > 0 && (
                  <div className={`h-px w-4 sm:w-6 flex-shrink-0 ${done ? "bg-primary" : "bg-border"}`} />
                )}

                <div className="flex items-center gap-1.5">
                  {/* Círculo */}
                  <div
                    className={`size-5 sm:size-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <span className="text-[10px] font-extrabold">{s.n}</span>
                    )}
                  </div>

                  {/* Label — esconde em mobile */}
                  <span
                    className={`text-xs font-semibold hidden md:block transition-colors ${
                      active
                        ? "text-foreground"
                        : done
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Botão sair */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Sair</span>
        </button>
      </header>

      {/* ── Conteúdo centralizado, sem nav lateral ── */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
