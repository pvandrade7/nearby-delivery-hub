import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Navigation, Phone, Check } from "lucide-react";
import { deliveryProposals } from "@/data/mockData";

type Phase = "ir-coleta" | "retirar" | "ir-cliente" | "entregar";

const phaseConfig: Record<Phase, { label: string; cta: string; next: Phase | null }> = {
  "ir-coleta": { label: "A caminho da loja", cta: "Cheguei na loja", next: "retirar" },
  retirar: { label: "Retirando pedido", cta: "Confirmar retirada", next: "ir-cliente" },
  "ir-cliente": { label: "A caminho do cliente", cta: "Cheguei no cliente", next: "entregar" },
  entregar: { label: "Entregando", cta: "Finalizar entrega", next: null },
};

const phases: Phase[] = ["ir-coleta", "retirar", "ir-cliente", "entregar"];

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
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-1">{cfg.label}</h1>
      <p className="text-sm text-muted-foreground mb-6">{proposal.orderId} • {proposal.storeName}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="h-80 lg:h-[480px] bg-gradient-to-br from-success/30 via-warning/20 to-primary/30 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 400 250" preserveAspectRatio="none">
              <path d="M40,200 Q120,150 200,160 T380,60" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="6 4" fill="none" />
              <circle cx="40" cy="200" r="10" fill="hsl(var(--secondary))" />
              <circle cx="380" cy="60" r="10" fill="hsl(var(--success))" />
              <g transform="translate(180,150)">
                <circle r="14" fill="hsl(var(--primary))" />
                <text textAnchor="middle" y="5" fill="white" fontSize="14">🛵</text>
              </g>
            </svg>
            <div className="absolute top-4 right-4 bg-background/95 backdrop-blur rounded-xl px-3 py-2 shadow-card text-xs font-bold flex items-center gap-2">
              <Navigation className="w-3 h-3 text-primary" />
              {proposal.estimatedTime} • {proposal.distance}
            </div>
          </div>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              {phase === "ir-coleta" || phase === "retirar" ? "Coleta em" : "Entrega em"}
            </p>
            <div className="flex items-center gap-3 mt-3">
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
              <button className="size-10 rounded-full gradient-brand text-primary-foreground flex items-center justify-center" aria-label="Ligar">
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-accent rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-accent-foreground font-bold uppercase tracking-wider">Você vai ganhar</p>
              <p className="text-3xl font-extrabold text-primary mt-1">R$ {proposal.earnings.toFixed(2)}</p>
            </div>
            <span className="text-4xl">💰</span>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="font-bold text-sm mb-4">Etapas</h2>
            <div className="space-y-2">
              {phases.map((p, i) => {
                const idx = phases.indexOf(phase);
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

          <button
            onClick={advance}
            className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
          >
            {cfg.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourierRoute;
