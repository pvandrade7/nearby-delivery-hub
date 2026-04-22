import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Power, Wallet, MapPin, Clock, ChevronRight, TrendingUp, Star } from "lucide-react";
import { deliveryProposals } from "@/data/mockData";

const stats = [
  { label: "Saldo", value: "R$ 142,80", icon: Wallet, accent: "text-primary", bg: "bg-primary/10" },
  { label: "Entregas hoje", value: "8", icon: TrendingUp, accent: "text-secondary", bg: "bg-secondary/10" },
  { label: "Avaliação", value: "4.9", icon: Star, accent: "text-warning", bg: "bg-warning/15" },
  { label: "Tempo médio", value: "18 min", icon: Clock, accent: "text-success", bg: "bg-success/15" },
];

const CourierHome = () => {
  const [online, setOnline] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Boa noite, Carlos 🛵</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Central do entregador</h1>
        </div>
        <button
          onClick={() => setOnline((o) => !o)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-card transition-all ${
            online ? "gradient-brand text-primary-foreground shadow-glow" : "bg-muted text-foreground"
          }`}
        >
          <Power className="w-4 h-4" />
          {online ? "Online — recebendo corridas" : "Ficar online"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
            <div className={`size-10 rounded-xl ${s.bg} ${s.accent} flex items-center justify-center`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold mt-4">{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Proposals grid */}
      {online ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold">Propostas de entrega</h2>
            <Link to="/" className="text-sm text-primary font-semibold hover:underline">Histórico</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {deliveryProposals.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/entregador/corrida/${d.id}`)}
                className="text-left bg-card rounded-2xl p-5 shadow-card border-2 border-transparent hover:border-primary hover:shadow-elevated transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{d.orderId}</p>
                    <p className="font-bold text-base">{d.storeName}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">R$ {d.earnings.toFixed(2)}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 items-start">
                    <div className="size-7 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Coleta</p>
                      <p className="font-semibold">{d.pickup}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="size-7 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Entrega</p>
                      <p className="font-semibold">{d.dropoff}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.distance}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {d.estimatedTime}</span>
                  <span className="text-primary font-bold flex items-center">
                    Aceitar <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="bg-card rounded-2xl shadow-card text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-3">😴</p>
          <p className="font-semibold">Você está offline.</p>
          <p className="text-sm">Fique online para receber corridas.</p>
        </div>
      )}
    </div>
  );
};

export default CourierHome;
