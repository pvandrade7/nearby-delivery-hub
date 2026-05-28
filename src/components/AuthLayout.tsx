import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Package,
  Bike,
  Store,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ReactNode } from "react";

/* ── Animated illustration panel ─────────────────────── */
const DeliveryScene = () => (
  <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden select-none">

    {/* Background blobs */}
    <div
      className="absolute w-72 h-72 rounded-full bg-white/10 top-4 -left-16"
      style={{ animation: "auth-blob 9s ease-in-out infinite" }}
    />
    <div
      className="absolute w-56 h-56 rounded-full bg-white/8 bottom-4 -right-12"
      style={{ animation: "auth-blob 11s ease-in-out infinite reverse" }}
    />

    {/* Central hub */}
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <div
        className="absolute w-52 h-52 rounded-full border-2 border-white/20"
        style={{ animation: "auth-spin-slow 30s linear infinite" }}
      >
        {/* Dots on ring */}
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/40" />
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/40" />
      </div>

      {/* Orbiting icons */}
      <OrbitIcon icon={ShoppingBag} radius={100} startDeg={0}   size="sm" />
      <OrbitIcon icon={Package}     radius={100} startDeg={90}  size="sm" delay={-3.5} />
      <OrbitIcon icon={Bike}        radius={100} startDeg={180} size="sm" delay={-7} />
      <OrbitIcon icon={MapPin}      radius={100} startDeg={270} size="sm" delay={-10.5} />

      {/* Inner glow ring */}
      <div className="absolute w-32 h-32 rounded-full bg-white/10 blur-xl" />

      {/* Central logo */}
      <div className="relative z-10 w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex flex-col items-center justify-center shadow-glow"
        style={{ animation: "auth-pulse-glow 4s ease-in-out infinite" }}
      >
        <span className="text-white font-extrabold text-3xl leading-none">V+</span>
        <span className="text-white/70 text-[10px] font-bold tracking-widest uppercase mt-0.5">Vendy</span>
      </div>
    </div>

    {/* Floating cards — top-left */}
    <FloatingCard
      icon={<Store className="w-4 h-4 text-orange-300" />}
      label="Lojas perto"
      value="47 lojas"
      className="absolute top-6 left-6"
      delay={0}
    />

    {/* Floating cards — bottom-right */}
    <FloatingCard
      icon={<Package className="w-4 h-4 text-pink-300" />}
      label="Entrega"
      value="em 30 min"
      className="absolute bottom-10 right-6"
      delay={2}
    />

    {/* Floating cards — top-right */}
    <FloatingCard
      icon={<Sparkles className="w-4 h-4 text-yellow-300" />}
      label="Ofertas"
      value="do bairro"
      className="absolute top-10 right-4"
      delay={1}
    />

    {/* Sparkle stars */}
    <Star className="absolute top-1/3 left-8 w-4 h-4 text-white/50"
      style={{ animation: "auth-sparkle 3s ease-in-out infinite" }} />
    <Star className="absolute bottom-1/4 left-16 w-3 h-3 text-white/40"
      style={{ animationName: "auth-sparkle", animationDuration: "4s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite", animationDelay: "1s" }} />
    <Star className="absolute top-16 right-16 w-3 h-3 text-white/50"
      style={{ animationName: "auth-sparkle", animationDuration: "2.5s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite", animationDelay: "0.5s" }} />
  </div>
);

/* Orbit helper */
function OrbitIcon({
  icon: Icon,
  radius,
  startDeg,
  size = "sm",
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  radius: number;
  startDeg: number;
  size?: "sm" | "md";
  delay?: number;
}) {
  const sz = size === "md" ? "w-11 h-11" : "w-9 h-9";
  const iconSz = size === "md" ? "w-5 h-5" : "w-4 h-4";
  const rad = (startDeg * Math.PI) / 180;
  const ox = Math.cos(rad) * radius;
  const oy = Math.sin(rad) * radius;

  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        top: "50%",
        marginLeft: `${ox - 18}px`,
        marginTop: `${oy - 18}px`,
        animationName: "auth-float",
        animationDuration: `${2.5 + (startDeg / 360) * 1.5}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDelay: `${delay}s`,
      }}
    >
      <div className={`${sz} rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg`}>
        <Icon className={`${iconSz} text-white`} />
      </div>
    </div>
  );
}

/* Floating stat card */
function FloatingCard({
  icon,
  label,
  value,
  className,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
  delay: number;
}) {
  return (
    <div
      className={`${className} bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg`}
      style={{
        animationName: "auth-float-r",
        animationDuration: `${3 + delay * 0.4}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDelay: `${delay * 0.6}s`,
      }}
    >
      <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider leading-none">{label}</p>
        <p className="text-white text-xs font-extrabold leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ── Layout principal ─────────────────────────────────── */
type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="min-h-dvh flex bg-background">

    {/* ── Painel esquerdo (lg+) ────────────────────────── */}
    <aside
      className="hidden lg:flex w-[44%] xl:w-[42%] shrink-0 flex-col gradient-brand relative overflow-hidden"
      aria-hidden="true"
    >
      {/* Texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.08)_0%,_transparent_60%)]" />

      {/* Logo topo */}
      <div className="relative z-10 px-10 pt-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
            V+
          </div>
          <div>
            <p className="text-white font-extrabold text-xl leading-none">
              Vendy<span className="opacity-70">+</span>
            </p>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">marketplace local</p>
          </div>
        </Link>
      </div>

      {/* Cena animada */}
      <DeliveryScene />

      {/* Tagline fundo */}
      <div className="relative z-10 px-10 pb-10">
        <h2 className="text-white font-extrabold text-2xl xl:text-3xl leading-snug">
          Tudo perto<br />de você.
        </h2>
        <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xs">
          Compre nas lojas do seu bairro, acompanhe entregas em tempo real e descubra o melhor da sua cidade.
        </p>

        {/* Social proof */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex -space-x-2">
            {["#f87d3a", "#e63d83", "#f5620f", "#6366f1"].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center text-white font-bold text-xs"
                style={{ background: c }}>
                {["J", "M", "C", "A"][i]}
              </div>
            ))}
          </div>
          <p className="text-white/70 text-xs font-semibold">
            +12 mil pessoas já usam
          </p>
        </div>
      </div>
    </aside>

    {/* ── Painel direito (formulário) ──────────────────── */}
    <main className="flex-1 flex flex-col overflow-y-auto">
      {/* Logo mobile */}
      <div className="lg:hidden flex items-center gap-3 px-6 pt-8 pb-2">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-glow">
            V+
          </div>
          <span className="font-extrabold text-lg">
            Vendy<span className="text-primary">+</span>
          </span>
        </Link>
      </div>

      {/* Conteúdo do formulário */}
      <div
        className="flex-1 flex flex-col justify-center"
        style={{ animation: "auth-slide-up 0.4s ease-out both" }}
      >
        {children}
      </div>
    </main>
  </div>
);
