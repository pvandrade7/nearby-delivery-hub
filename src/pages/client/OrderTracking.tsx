import { useEffect, useState } from "react";
import { Check, Package, Bike, Home as HomeIcon, MessageCircle, Phone } from "lucide-react";

const steps = [
  { id: 0, icon: Check, label: "Pedido confirmado", desc: "Recebemos seu pedido" },
  { id: 1, icon: Package, label: "Em preparação", desc: "A loja está preparando" },
  { id: 2, icon: Bike, label: "Saiu para entrega", desc: "Carlos a caminho" },
  { id: 3, icon: HomeIcon, label: "Entregue", desc: "Tudo certo!" },
];

const OrderTracking = () => {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a < 3 ? a + 1 : a)), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Rastrear pedido</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="h-72 lg:h-96 bg-gradient-to-br from-success/30 via-warning/20 to-primary/30 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 400 250" preserveAspectRatio="none">
              <path d="M40,200 Q120,150 200,160 T380,60" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="6 4" fill="none" />
              <circle cx="40" cy="200" r="8" fill="hsl(var(--secondary))" />
              <circle cx="380" cy="60" r="8" fill="hsl(var(--success))" />
            </svg>
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-xl px-3 py-2 shadow-card text-xs font-semibold flex items-center gap-2 animate-pulse-soft">
              <span className="size-2 rounded-full bg-success" />
              Entregador a 600m
            </div>
          </div>
        </div>

        {/* Steps + courier */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className="size-12 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-bold">C</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Carlos Mendes</p>
              <p className="text-xs text-muted-foreground">Moto • Honda CG 160</p>
            </div>
            <button className="size-9 rounded-full bg-accent text-primary flex items-center justify-center" aria-label="Mensagem">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button className="size-9 rounded-full gradient-brand text-primary-foreground flex items-center justify-center" aria-label="Ligar">
              <Phone className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="font-bold text-sm mb-4">Status do pedido</h2>
            <div className="space-y-1">
              {steps.map((s, i) => {
                const done = i <= active;
                const isCurrent = i === active;
                return (
                  <div key={s.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-9 rounded-full flex items-center justify-center transition-all ${
                          done ? "gradient-brand text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "animate-pulse-soft" : ""}`}
                      >
                        <s.icon className="w-4 h-4" />
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 min-h-[24px] ${done && i < active ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <p className={`font-bold text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
