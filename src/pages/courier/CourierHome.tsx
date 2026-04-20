import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Power, Wallet, MapPin, Clock, ChevronRight } from "lucide-react";
import { deliveryProposals } from "@/data/mockData";

const CourierHome = () => {
  const [online, setOnline] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="gradient-sunset text-primary-foreground px-5 pt-6 pb-8 rounded-b-[2rem]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs opacity-80 font-semibold uppercase tracking-wider">Boa noite,</p>
            <h1 className="text-xl font-extrabold">Carlos 🛵</h1>
          </div>
          <Link to="/" className="size-10 rounded-full bg-white/25 backdrop-blur flex items-center justify-center font-bold">
            C
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3">
            <Wallet className="w-4 h-4 mb-1.5" />
            <p className="text-xs opacity-90 font-semibold">Saldo</p>
            <p className="text-xl font-extrabold">R$ 142,80</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3">
            <p className="text-xs opacity-90 font-semibold">Entregas hoje</p>
            <p className="text-xl font-extrabold">8</p>
            <p className="text-[10px] opacity-90">↑ 2 que ontem</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-5 pb-6">
        <button
          onClick={() => setOnline((o) => !o)}
          className={`w-full rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-card transition-all ${
            online ? "gradient-brand text-primary-foreground shadow-glow" : "bg-muted text-foreground"
          }`}
        >
          <Power className="w-5 h-5" />
          {online ? "Você está online — recebendo corridas" : "Ficar online"}
        </button>

        {online && (
          <section className="mt-6">
            <h2 className="font-bold mb-3">Propostas de entrega</h2>
            <div className="space-y-3">
              {deliveryProposals.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/entregador/corrida/${d.id}`)}
                  className="w-full text-left bg-card rounded-2xl p-4 shadow-card border-2 border-transparent hover:border-primary transition-colors animate-slide-up"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{d.orderId}</p>
                      <p className="font-bold text-sm">{d.storeName}</p>
                    </div>
                    <p className="text-xl font-extrabold text-primary">R$ {d.earnings.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2 items-start">
                      <div className="size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold">COLETA</p>
                        <p className="font-semibold">{d.pickup}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="size-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold">ENTREGA</p>
                        <p className="font-semibold">{d.dropoff}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.distance}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {d.estimatedTime}</span>
                    <span className="text-primary font-bold flex items-center">Aceitar <ChevronRight className="w-4 h-4" /></span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {!online && (
          <div className="text-center text-sm text-muted-foreground mt-12">
            <p className="text-5xl mb-3">😴</p>
            <p>Você está offline.<br />Fique online para receber corridas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourierHome;
