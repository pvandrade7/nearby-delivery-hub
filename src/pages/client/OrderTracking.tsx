import { useEffect, useState } from "react";
import { Check, Package, Bike, Home as HomeIcon, MessageCircle, Phone } from "lucide-react";
import { TopBar } from "@/components/TopBar";

const steps = [
  { id: 0, icon: Check, label: "Pedido confirmado", desc: "Recebemos seu pedido" },
  { id: 1, icon: Package, label: "Em preparação", desc: "A loja está preparando" },
  { id: 2, icon: Bike, label: "Saiu para entrega", desc: "Carlos a caminho" },
  { id: 3, icon: HomeIcon, label: "Entregue", desc: "Bom apetite!" },
];

const OrderTracking = () => {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a < 3 ? a + 1 : a)), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Rastrear pedido" />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Map mock */}
        <div className="h-56 bg-gradient-to-br from-success/30 via-warning/20 to-primary/30 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 200">
            <path d="M0,150 Q100,100 200,120 T400,80" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="6 4" fill="none" />
            <circle cx="60" cy="140" r="8" fill="hsl(var(--secondary))" />
            <circle cx="340" cy="90" r="8" fill="hsl(var(--success))" />
          </svg>
          <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur rounded-xl px-3 py-2 shadow-card text-xs font-semibold flex items-center gap-2 animate-pulse-soft">
            <span className="size-2 rounded-full bg-success" />
            Entregador a 600m
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className="size-12 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-bold">C</div>
            <div className="flex-1">
              <p className="font-bold text-sm">Carlos Mendes</p>
              <p className="text-xs text-muted-foreground">Moto • Honda CG 160</p>
            </div>
            <button className="size-10 rounded-full bg-accent text-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="size-10 rounded-full gradient-brand text-primary-foreground flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 space-y-1">
            {steps.map((s, i) => {
              const done = i <= active;
              const isCurrent = i === active;
              return (
                <div key={s.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center transition-all ${
                        done ? "gradient-brand text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "animate-pulse-soft" : ""}`}
                    >
                      <s.icon className="w-5 h-5" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[28px] ${done && i < active ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pb-6 flex-1">
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
  );
};

export default OrderTracking;
