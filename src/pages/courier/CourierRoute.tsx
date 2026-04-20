import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Navigation, Phone, Check } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { deliveryProposals } from "@/data/mockData";

type Phase = "ir-coleta" | "retirar" | "ir-cliente" | "entregar";

const phaseConfig: Record<Phase, { label: string; cta: string; next: Phase | null }> = {
  "ir-coleta": { label: "A caminho da loja", cta: "Cheguei na loja", next: "retirar" },
  retirar: { label: "Retirando pedido", cta: "Confirmar retirada", next: "ir-cliente" },
  "ir-cliente": { label: "A caminho do cliente", cta: "Cheguei no cliente", next: "entregar" },
  entregar: { label: "Entregando", cta: "Finalizar entrega", next: null },
};

const CourierRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const proposal = deliveryProposals.find((d) => d.id === id) ?? deliveryProposals[0];
  const [phase, setPhase] = useState<Phase>("ir-coleta");

  const cfg = phaseConfig[phase];

  const advance = () => {
    if (cfg.next) setPhase(cfg.next);
    else navigate("/entregador/finalizada");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title={cfg.label} />

      {/* Map */}
      <div className="h-64 bg-gradient-to-br from-success/30 via-warning/20 to-primary/30 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 400 250">
          <path d="M40,200 Q120,150 200,160 T380,60" stroke="hsl(var(--primary))" strokeWidth="4" strokeDasharray="8 4" fill="none" />
          <circle cx="40" cy="200" r="10" fill="hsl(var(--secondary))" />
          <circle cx="380" cy="60" r="10" fill="hsl(var(--success))" />
          <g transform="translate(180,150)">
            <circle r="14" fill="hsl(var(--primary))" />
            <text textAnchor="middle" y="5" fill="white" fontSize="14">🛵</text>
          </g>
        </svg>
        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur rounded-xl px-3 py-2 shadow-card text-xs font-bold flex items-center gap-2">
          <Navigation className="w-3 h-3 text-primary" />
          {proposal.estimatedTime} • {proposal.distance}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            {phase === "ir-coleta" || phase === "retirar" ? "Coleta em" : "Entrega em"}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className={`size-12 rounded-2xl flex items-center justify-center ${
              phase === "ir-coleta" || phase === "retirar"
                ? "bg-primary/15 text-primary"
                : "bg-success/15 text-success"
            }`}>
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">
                {phase === "ir-coleta" || phase === "retirar" ? proposal.storeName : "João Souza"}
              </p>
              <p className="text-xs text-muted-foreground">
                {phase === "ir-coleta" || phase === "retirar" ? proposal.pickup : proposal.dropoff}
              </p>
            </div>
            <button className="size-10 rounded-full gradient-brand text-primary-foreground flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-accent rounded-2xl p-4 mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-accent-foreground font-semibold">Você vai ganhar</p>
            <p className="text-2xl font-extrabold text-primary">R$ {proposal.earnings.toFixed(2)}</p>
          </div>
          <span className="text-3xl">💰</span>
        </div>

        {/* Steps */}
        <div className="mt-6 space-y-1.5">
          {(["ir-coleta", "retirar", "ir-cliente", "entregar"] as Phase[]).map((p, i) => {
            const idx = (["ir-coleta", "retirar", "ir-cliente", "entregar"] as Phase[]).indexOf(phase);
            const done = i <= idx;
            return (
              <div key={p} className="flex items-center gap-3">
                <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <p className={`text-sm ${done ? "font-bold" : "text-muted-foreground"}`}>{phaseConfig[p].label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border bg-background">
        <button
          onClick={advance}
          className="w-full gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated active:scale-[0.98] transition-transform"
        >
          {cfg.cta}
        </button>
      </div>
    </div>
  );
};

export default CourierRoute;
