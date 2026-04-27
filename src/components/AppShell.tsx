import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Store as StoreIcon,
  ShoppingBag,
  User,
  LayoutDashboard,
  Package,
  Settings,
  Bike,
  Wallet,
  RefreshCw,
  ShoppingCart,
  Bell,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

type NavItem = { to: string; icon: typeof Home; label: string };

const notificationsByProfile: Record<"cliente" | "lojista" | "entregador" | "admin", { title: string; body: string; time: string }[]> = {
  cliente: [
    { title: "Pedido atualizado", body: "Sua compra #1043 está sendo preparada.", time: "Agora" },
    { title: "Oferta perto de você", body: "Lâmpadas e ferramentas com desconto hoje.", time: "12 min" },
  ],
  lojista: [
    { title: "Novo pedido recebido", body: "Pedido #1045 aguardando confirmação.", time: "Agora" },
    { title: "Estoque baixo", body: "Detergente neutro está com poucas unidades.", time: "35 min" },
  ],
  entregador: [],
  admin: [
    { title: "Verificação pendente", body: "2 vendedores aguardam análise manual.", time: "Agora" },
  ],
};

const clientNav: NavItem[] = [
  { to: "/cliente/home", icon: Home, label: "Início" },
  { to: "/cliente/busca", icon: Search, label: "Buscar" },
  { to: "/cliente/lojas", icon: StoreIcon, label: "Lojas" },
  { to: "/cliente/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { to: "/cliente/perfil", icon: User, label: "Perfil" },
];

const sellerNav: NavItem[] = [
  { to: "/lojista/painel", icon: LayoutDashboard, label: "Painel" },
  { to: "/lojista/produtos", icon: Package, label: "Produtos" },
  { to: "/lojista/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { to: "/lojista/verificacao", icon: BadgeCheck, label: "Verificação" },
  { to: "/lojista/config", icon: Settings, label: "Conta" },
];

const adminNav: NavItem[] = [
  { to: "/admin/verificacoes", icon: BadgeCheck, label: "Verificações" },
  { to: "/lojista/painel", icon: LayoutDashboard, label: "Lojista" },
];

const courierNav: NavItem[] = [
  { to: "/entregador/painel", icon: Bike, label: "Corridas" },
  { to: "/entregador/finalizada", icon: Wallet, label: "Ganhos" },
];

const profileMeta: Record<
  "cliente" | "lojista" | "entregador" | "admin",
  { label: string; user: string; initial: string; nav: NavItem[] }
> = {
  cliente: { label: "Cliente", user: "João Souza", initial: "J", nav: clientNav },
  lojista: { label: "Lojista", user: "Marina Flores", initial: "M", nav: sellerNav },
  entregador: { label: "Entregador", user: "Carlos Mendes", initial: "C", nav: courierNav },
  admin: { label: "Admin", user: "Admin Vendy+", initial: "A", nav: adminNav },
};

const useProfile = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return "admin" as const;
  if (pathname.startsWith("/lojista")) return "lojista" as const;
  if (pathname.startsWith("/entregador")) return "entregador" as const;
  if (pathname.startsWith("/cliente")) return "cliente" as const;
  return null;
};

export const AppShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useProfile();
  const { count } = useCart();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationsOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [notificationsOpen]);

  // Landing page (RoleSelect): full bleed, no shell.
  if (location.pathname === "/" || !profile) {
    return <div className="min-h-dvh w-full bg-background">{children}</div>;
  }

  const meta = profileMeta[profile];

  return (
    <div className="min-h-dvh w-full bg-muted/40 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r border-border sticky top-0 h-dvh">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border">
          <div className="size-9 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center font-extrabold shadow-glow">
            V+
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-base">Vendy<span className="text-primary">+</span></p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{meta.label}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {meta.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
              {item.label === "Pedidos" && profile === "cliente" && count > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-2 py-0.5">
                  {count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Trocar de perfil
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border h-16 px-4 lg:px-8 flex items-center gap-4">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="size-8 rounded-lg gradient-brand text-primary-foreground flex items-center justify-center font-extrabold text-sm">
              V+
            </div>
          </div>

          {/* Centered search (clients) */}
          {profile === "cliente" ? (
            <button
              onClick={() => navigate("/cliente/busca")}
              className="flex-1 max-w-2xl mx-auto bg-muted hover:bg-muted/70 transition-colors rounded-xl px-4 h-10 flex items-center gap-3 text-left text-sm text-muted-foreground"
            >
              <Search className="w-4 h-4 text-primary" />
              Buscar produtos ou lojas
            </button>
          ) : (
            <h1 className="flex-1 font-bold text-base lg:text-lg truncate">
              {meta.label === "Lojista" ? "Painel da loja" : meta.label === "Admin" ? "Painel administrativo" : "Central do entregador"}
            </h1>
          )}

          <div className="flex items-center gap-2">
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setNotificationsOpen((open) => !open)}
                className="size-10 rounded-full bg-muted hover:bg-muted/70 transition-colors flex items-center justify-center relative"
                aria-label="Notificações"
                aria-expanded={notificationsOpen}
              >
              <Bell className="w-4 h-4" />
                {notificationsByProfile[profile].length > 0 && (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-secondary" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card text-card-foreground shadow-elevated z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-extrabold text-sm">Notificações</p>
                    <p className="text-xs text-muted-foreground">Atualizações recentes do Vendy+</p>
                  </div>
                  {notificationsByProfile[profile].length > 0 ? (
                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                      {notificationsByProfile[profile].map((notification) => (
                        <div key={`${notification.title}-${notification.time}`} className="px-4 py-3 hover:bg-muted/60 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold leading-tight">{notification.title}</p>
                            <span className="text-[11px] text-muted-foreground shrink-0">{notification.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notification.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm font-semibold">Voce nao tem notificacoes</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {profile === "cliente" && (
              <Link
                to="/cliente/carrinho"
                className="size-10 rounded-full bg-muted hover:bg-muted/70 transition-colors flex items-center justify-center relative"
                aria-label="Carrinho"
              >
                <ShoppingCart className="w-4 h-4" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/"
              className="size-10 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-bold text-sm shadow-card"
              title={meta.user}
            >
              {meta.initial}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden sticky bottom-0 inset-x-0 bg-card border-t border-border px-2 pt-2 pb-3 flex justify-around z-30">
          {meta.nav.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
