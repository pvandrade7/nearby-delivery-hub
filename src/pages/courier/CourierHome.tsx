import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Power, Wallet, TrendingUp, Star, Clock, MapPin, ChevronRight,
  Navigation, RefreshCw, Package, Zap, SlidersHorizontal, X,
} from "lucide-react";
import { deliveryProposals, type DeliveryProposal } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── persistência das preferências do entregador ─────── */
const PREFS_KEY = "vendy_courier_prefs";

type Prefs = {
  region: string;
  radiusKm: number;
  online: boolean;
};

const loadPrefs = (): Prefs => {
  try { return { region: "", radiusKm: 5, online: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") }; }
  catch { return { region: "", radiusKm: 5, online: true }; }
};

const savePrefs = (p: Partial<Prefs>) => {
  const cur = loadPrefs();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...cur, ...p }));
};

/* ── radar SVG ───────────────────────────────────────── */
const Radar = ({
  proposals, radiusKm, online,
}: { proposals: DeliveryProposal[]; radiusKm: number; online: boolean }) => {
  const cx = 160; const cy = 160; const maxR = 130;

  const toXY = (km: number, angleDeg: number) => {
    const r = Math.min((km / radiusKm) * maxR, maxR * 1.05);
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const ringRatios = [0.33, 0.66, 1];
  const ringLabels = [
    `${(radiusKm * 0.33).toFixed(1)}km`,
    `${(radiusKm * 0.66).toFixed(1)}km`,
    `${radiusKm}km`,
  ];

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[280px] mx-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Fundo escuro */}
      <circle cx={cx} cy={cy} r="155" fill="#0f172a" />
      <circle cx={cx} cy={cy} r="155" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" />

      {/* Anéis concêntricos */}
      {ringRatios.map((ratio, i) => (
        <g key={i}>
          <circle
            cx={cx} cy={cy} r={maxR * ratio}
            fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="1" strokeDasharray="5 4"
          />
          <text
            x={cx + maxR * ratio + 4} y={cy - 4}
            fill="rgba(148,163,184,0.6)" fontSize="8" fontWeight="600"
          >
            {ringLabels[i]}
          </text>
        </g>
      ))}

      {/* Linhas de grade */}
      {[0, 45, 90, 135].map((deg) => {
        const rad = deg * Math.PI / 180;
        return (
          <line
            key={deg}
            x1={cx - maxR * Math.cos(rad)} y1={cy - maxR * Math.sin(rad)}
            x2={cx + maxR * Math.cos(rad)} y2={cy + maxR * Math.sin(rad)}
            stroke="rgba(99,102,241,0.1)" strokeWidth="1"
          />
        );
      })}

      {/* Varredura do radar (animada) */}
      {online && (
        <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path
            d={`M ${cx},${cy} L ${cx},${cy - maxR} A ${maxR},${maxR} 0 0,1 ${cx + maxR * Math.sin(60 * Math.PI / 180)},${cy - maxR * Math.cos(60 * Math.PI / 180)} Z`}
            fill="url(#radarGrad)"
            style={{ animation: "spin 4s linear infinite", transformOrigin: `${cx}px ${cy}px` }}
          />
          <defs>
            <radialGradient id="radarGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
              gradientTransform={`translate(${cx},${cy}) scale(${maxR})`}>
              <stop offset="0%" stopColor="rgba(99,102,241,0)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.25)" />
            </radialGradient>
          </defs>
        </g>
      )}

      {/* Propostas de entrega */}
      {proposals.map((p, i) => {
        const angle = (i / proposals.length) * 360 + 15;
        const pos = toXY(p.distanceKm, angle);
        const inside = p.distanceKm <= radiusKm;
        const pct = p.distanceKm / radiusKm;
        const color = pct < 0.4 ? "#22c55e" : pct < 0.75 ? "#f97316" : "#ef4444";

        return (
          <g key={p.id}>
            {inside && pct < 0.5 && (
              <circle cx={pos.x} cy={pos.y} r="12" fill={color} opacity="0.2">
                <animate attributeName="r" values="7;16;7" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0;0.2" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={pos.x} cy={pos.y} r="7"
              fill={inside ? color : "rgba(100,116,139,0.4)"}
              stroke={inside ? "white" : "rgba(100,116,139,0.3)"}
              strokeWidth="1.5"
            />
            {inside && (
              <text
                x={pos.x} y={pos.y + 4}
                textAnchor="middle" fill="white" fontSize="6" fontWeight="700"
              >
                R$
              </text>
            )}
          </g>
        );
      })}

      {/* Centro — posição do entregador */}
      <circle cx={cx} cy={cy} r="20" fill="rgba(249,115,22,0.15)">
        {online && <animate attributeName="r" values="16;26;16" dur="2.5s" repeatCount="indefinite" />}
        {online && <animate attributeName="opacity" values="0.15;0;0.15" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx={cx} cy={cy} r="16" fill="#f97316" stroke="white" strokeWidth="2.5" />
      <text textAnchor="middle" x={cx} y={cy + 5} fontSize="14" style={{ userSelect: "none" }}>🛵</text>

      {/* Status label */}
      <rect x={cx - 24} y={cy + 22} width="48" height="13" rx="6"
        fill={online ? "rgba(34,197,94,0.9)" : "rgba(100,116,139,0.7)"} />
      <text textAnchor="middle" x={cx} y={cy + 32} fontSize="8" fill="white" fontWeight="700">
        {online ? "ONLINE" : "OFFLINE"}
      </text>
    </svg>
  );
};

/* ── barra de proximidade ────────────────────────────── */
const ProxBar = ({ km, radiusKm }: { km: number; radiusKm: number }) => {
  const pct = Math.min(100, (km / radiusKm) * 100);
  const color =
    pct < 35 ? "bg-green-500" :
    pct < 65 ? "bg-amber-500" :
    "bg-orange-500";
  return (
    <div className="mt-2.5 mb-0.5">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════ */
const CourierHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [editingRegion, setEditingRegion] = useState(false);
  const [regionInput, setRegionInput] = useState(prefs.region);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newProposalId, setNewProposalId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const radiusKm = prefs.radiusKm;
  const online    = prefs.online;
  const region    = prefs.region;

  /* ── helpers ─────────────────────────────────────── */
  const update = (p: Partial<Prefs>) => {
    const next = { ...prefs, ...p };
    setPrefs(next);
    savePrefs(p);
  };

  const saveRegion = () => {
    update({ region: regionInput.trim() });
    setEditingRegion(false);
    toast.success("Região atualizada!");
  };

  const refresh = () => {
    setLastUpdate(new Date());
    toast.success("Corridas atualizadas!");
  };

  /* ── filtro e ordenação ──────────────────────────── */
  const filtered = deliveryProposals
    .filter((d) => d.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const outside = deliveryProposals.filter((d) => d.distanceKm > radiusKm);

  /* ── auto-refresh simulado ───────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setLastUpdate(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  /* ── notificação de nova corrida próxima ─────────── */
  useEffect(() => {
    if (!online) return;
    const t = setTimeout(() => {
      const closest = filtered[0];
      if (closest) {
        setNewProposalId(closest.id);
        toast("🛵 Nova corrida disponível!", {
          description: `${closest.storeName} — R$ ${closest.earnings.toFixed(2)} · ${closest.distanceKm.toFixed(1)} km`,
          duration: 4000,
        });
        setTimeout(() => setNewProposalId(null), 5000);
      }
    }, 6000);
    return () => clearTimeout(t);
  }, [online, filtered.length]);

  /* ── carrega região do perfil se não tiver ──────── */
  useEffect(() => {
    if (prefs.region || !user) return;
    supabase.from("profiles").select("extras").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        const r = (data?.extras as Record<string, string> | null)?.region;
        if (r) update({ region: r });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const timeAgo = (d: Date) => {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "agora mesmo";
    return `${Math.floor(s / 60)} min atrás`;
  };

  /* ════════════════════════════════════════════════ */
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-5">

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {online ? "🟢 Online" : "⚫ Offline"} · Central do entregador
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-0.5">
            Olá, {user?.email?.split("@")[0] ?? "Entregador"} 🛵
          </h1>
        </div>
        <button
          onClick={() => update({ online: !online })}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-card transition-all ${
            online ? "gradient-brand text-primary-foreground shadow-glow" : "bg-muted text-foreground"
          }`}
        >
          <Power className="w-4 h-4" />
          {online ? "Online — recebendo corridas" : "Ficar online"}
        </button>
      </div>

      {/* ── Stats strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Wallet,    label: "Saldo",          value: "R$ 142,80", color: "text-primary",   bg: "bg-primary/10"   },
          { icon: TrendingUp,label: "Entregas hoje",   value: "8",         color: "text-secondary", bg: "bg-secondary/10" },
          { icon: Star,      label: "Avaliação",       value: "4.9 ⭐",    color: "text-warning",   bg: "bg-warning/15"   },
          { icon: Clock,     label: "Tempo médio",     value: "18 min",    color: "text-success",   bg: "bg-success/15"   },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 shadow-card">
            <div className={`size-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-extrabold mt-3">{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Painel de localização + radar ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Radar */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-sm">Radar de corridas</h2>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
              raio: {radiusKm} km
            </span>
          </div>
          <Radar proposals={deliveryProposals} radiusKm={radiusKm} online={online} />
          <div className="mt-4 flex gap-3 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-green-500 inline-block" /> &lt; 40% do raio</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-amber-500 inline-block" /> 40–75%</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-orange-500 inline-block" /> próx. limite</span>
          </div>
        </div>

        {/* Config panel */}
        <div className="lg:col-span-3 bg-card rounded-2xl shadow-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm">Sua localização</h2>
            <button
              onClick={refresh}
              className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
          </div>

          {/* Região */}
          {editingRegion ? (
            <div className="flex gap-2">
              <input
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRegion()}
                placeholder="Ex: Centro, Vila Nova, Bela Vista..."
                autoFocus
                className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={saveRegion} className="px-4 gradient-brand text-primary-foreground rounded-xl text-sm font-bold">
                OK
              </button>
              <button onClick={() => setEditingRegion(false)} className="px-2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{region || "Região não configurada"}</p>
                <p className="text-xs text-muted-foreground">Atualizado {timeAgo(lastUpdate)}</p>
              </div>
              <button
                onClick={() => { setRegionInput(region); setEditingRegion(true); }}
                className="text-xs text-primary font-bold hover:underline shrink-0"
              >
                Editar
              </button>
            </div>
          )}

          {/* Raio de busca */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              Raio de busca
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 20].map((r) => (
                <button
                  key={r}
                  onClick={() => update({ radiusKm: r })}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    radiusKm === r
                      ? "gradient-brand text-primary-foreground shadow-card"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Resumo da área */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-primary">{filtered.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">No raio</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold">
                {filtered.filter(d => d.priority === "alta").length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Prioridade</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-success">
                R${filtered.reduce((s, d) => s + d.earnings, 0).toFixed(0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Em ganhos</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lista de propostas ───────────────────────── */}
      {online ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-extrabold">
                {filtered.length > 0
                  ? `${filtered.length} corrida${filtered.length !== 1 ? "s" : ""} na sua área`
                  : "Nenhuma corrida no raio"}
              </h2>
              {region && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Região: <span className="font-semibold text-foreground">{region}</span>
                  {" · "}raio de <span className="font-semibold text-foreground">{radiusKm} km</span>
                </p>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-card text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">Nenhuma corrida no raio de {radiusKm} km</p>
              <p className="text-sm mt-1">Tente aumentar o raio de busca</p>
              <div className="flex justify-center gap-2 mt-4">
                {[10, 20].filter(r => r > radiusKm).map(r => (
                  <button
                    key={r}
                    onClick={() => update({ radiusKm: r })}
                    className="px-4 py-2 gradient-brand text-primary-foreground rounded-xl text-sm font-bold"
                  >
                    Ampliar para {r} km
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((d) => {
                const pct = Math.min(100, (d.distanceKm / radiusKm) * 100);
                const distColor =
                  pct < 35 ? "text-green-600 dark:text-green-400" :
                  pct < 65 ? "text-amber-600 dark:text-amber-400" :
                  "text-orange-600 dark:text-orange-400";
                const isNew = newProposalId === d.id;

                return (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/entregador/corrida/${d.id}`)}
                    className={`text-left bg-card rounded-2xl p-5 shadow-card border-2 transition-all hover:shadow-elevated group ${
                      isNew
                        ? "border-primary shadow-glow animate-pulse-soft"
                        : d.priority === "alta"
                          ? "border-secondary/40 hover:border-secondary"
                          : "border-transparent hover:border-primary/40"
                    }`}
                  >
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {isNew && (
                        <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🔔 NOVA
                        </span>
                      )}
                      {d.priority === "alta" && (
                        <span className="inline-flex items-center gap-1 bg-secondary/15 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Zap className="w-2.5 h-2.5" /> Alta prioridade
                        </span>
                      )}
                      <span className={`ml-auto text-xs font-bold ${distColor}`}>
                        📍 {d.distanceKm.toFixed(1)} km de você
                      </span>
                    </div>

                    {/* Loja + ganho */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{d.orderId}</p>
                        <p className="font-extrabold text-base">{d.category} {d.storeName}</p>
                        <p className="text-xs text-muted-foreground">{d.pickupNeighborhood}</p>
                      </div>
                      <p className="text-2xl font-extrabold text-primary shrink-0 ml-2">
                        R$ {d.earnings.toFixed(2)}
                      </p>
                    </div>

                    {/* Rota */}
                    <div className="space-y-2 mb-1">
                      <div className="flex gap-2.5 items-start">
                        <div className="size-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Coleta</p>
                          <p className="text-sm font-semibold truncate">{d.pickup}</p>
                          <p className="text-[11px] text-muted-foreground">{d.pickupNeighborhood}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <div className="size-6 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Entrega</p>
                          <p className="text-sm font-semibold truncate">{d.dropoff}</p>
                          <p className="text-[11px] text-muted-foreground">{d.dropoffNeighborhood}</p>
                        </div>
                      </div>
                    </div>

                    {/* Barra de proximidade */}
                    <ProxBar km={d.distanceKm} radiusKm={radiusKm} />

                    {/* Rodapé */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {d.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" /> {d.items} {d.items === 1 ? "item" : "itens"}
                      </span>
                      <span className="flex items-center gap-0.5 text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                        Aceitar <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Corridas fora do raio (colapsável) */}
          {outside.length > 0 && (
            <details className="mt-4 group">
              <summary className="flex items-center gap-2 text-sm text-muted-foreground font-semibold cursor-pointer hover:text-foreground select-none list-none">
                <SlidersHorizontal className="w-4 h-4" />
                {outside.length} corrida{outside.length !== 1 ? "s" : ""} fora do raio ({radiusKm} km)
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform ml-auto" />
              </summary>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-50">
                {outside.map((d) => (
                  <div key={d.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground">{d.orderId}</p>
                        <p className="font-bold text-sm">{d.category} {d.storeName}</p>
                        <p className="text-xs text-muted-foreground">{d.pickupNeighborhood}</p>
                      </div>
                      <p className="font-extrabold text-primary">R$ {d.earnings.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {d.distanceKm.toFixed(1)} km · Fora do raio
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>
      ) : (
        <div className="bg-card rounded-2xl shadow-card text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-4">😴</p>
          <p className="font-extrabold text-lg text-foreground">Você está offline</p>
          <p className="text-sm mt-1">Fique online para receber corridas na sua área</p>
          <button
            onClick={() => update({ online: true })}
            className="mt-6 inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-6 py-3 font-bold shadow-card hover:shadow-elevated transition-shadow"
          >
            <Power className="w-4 h-4" /> Ficar online agora
          </button>
        </div>
      )}
    </div>
  );
};

export default CourierHome;
