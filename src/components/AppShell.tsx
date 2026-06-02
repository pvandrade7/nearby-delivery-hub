import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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
  ShoppingCart,
  Bell,
  BadgeCheck,
  MessageCircle,
  FlaskConical,
  LogOut,
  Brush,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  { to: "/lojista/painel",     icon: LayoutDashboard, label: "Painel"      },
  { to: "/lojista/produtos",   icon: Package,         label: "Produtos"    },
  { to: "/lojista/pedidos",    icon: ShoppingBag,     label: "Pedidos"     },
  { to: "/lojista/minha-loja", icon: Brush,           label: "Minha Loja"  },
  { to: "/lojista/verificacao",icon: BadgeCheck,      label: "Verificação" },
  { to: "/lojista/config",     icon: Settings,        label: "Conta"       },
];

const adminNav: NavItem[] = [
  { to: "/admin/painel",       icon: LayoutDashboard, label: "Painel"        },
  { to: "/admin/verificacoes", icon: BadgeCheck,      label: "Verificações"  },
  { to: "/admin/suporte",      icon: MessageCircle,   label: "Suporte"       },
  { to: "/admin/usuarios",     icon: User,            label: "Usuários"      },
  { to: "/admin/lojas",        icon: StoreIcon,       label: "Lojas"         },
];

const courierNav: NavItem[] = [
  { to: "/entregador/painel", icon: Bike, label: "Corridas" },
  { to: "/entregador/finalizada", icon: Wallet, label: "Ganhos" },
  { to: "/entregador/perfil", icon: User, label: "Perfil" },
];

const profileMeta: Record<
  "cliente" | "lojista" | "entregador" | "admin",
  { label: string; user: string; initial: string; nav: NavItem[]; profilePath: string }
> = {
  cliente:     { label: "Cliente",     user: "João Souza",    initial: "J", nav: clientNav,  profilePath: "/cliente/perfil" },
  lojista:     { label: "Lojista",     user: "Marina Flores", initial: "M", nav: sellerNav,  profilePath: "/lojista/config" },
  entregador:  { label: "Entregador",  user: "Carlos Mendes", initial: "C", nav: courierNav, profilePath: "/entregador/perfil" },
  admin:       { label: "Admin",       user: "Admin Vendy+",  initial: "A", nav: adminNav,   profilePath: "/admin/verificacoes" },
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
  const { user, loading: authLoading, isDemo, signOut } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let cancelled = false;
    const refresh = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      const ids = (convs ?? []).map((c) => c.id);
      if (ids.length === 0) { if (!cancelled) setUnread(0); return; }
      const { count: c } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", user.id)
        .is("read_at", null);
      if (!cancelled) setUnread(c ?? 0);
    };
    void refresh();
    const ch = supabase
      .channel("unread-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user]);

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

  // Rotas de autenticação: sem shell (AppShell não é montado).
  // O layout próprio (AuthLayout) é responsável pela UI dessas rotas.
  const AUTH_ROUTES = new Set(["/", "/auth", "/cliente", "/lojista", "/entregador"]);
  if (AUTH_ROUTES.has(location.pathname) || !profile) {
    return <>{children}</>;
  }

  const meta = profileMeta[profile];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(profile === "cliente" ? "/cliente/home" : profile === "lojista" ? "/lojista/painel" : profile === "admin" ? "/admin/verificacoes" : "/entregador/painel");
  };

  return (
    <div className="min-h-dvh w-full bg-muted/40 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r border-border sticky top-0 h-dvh">
        <Link to="/" className="px-5 py-5 flex items-center gap-2.5 border-b border-border hover:bg-muted/40 transition-colors">
          <div className="size-9 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center font-extrabold shadow-glow">
            V+
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-base">Vendy<span className="text-primary">+</span></p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{meta.label}</p>
          </div>
        </Link>

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

        {/* Botão Sair — sempre visível na sidebar desktop */}
        <div className="px-3 pb-4 pt-2 border-t border-border">
          {user && (
            <p className="px-3 py-1 text-[11px] text-muted-foreground truncate font-medium mb-1">
              {user.email}
            </p>
          )}
          <button
            onClick={() => { signOut(); navigate("/", { replace: true }); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border h-14 sm:h-16 px-3 sm:px-4 lg:px-8 flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center shrink-0">
            <div className="size-8 rounded-lg gradient-brand text-primary-foreground flex items-center justify-center font-extrabold text-sm">
              V+
            </div>
          </div>

          <button
            onClick={handleBack}
            className="size-9 sm:size-10 rounded-full bg-muted hover:bg-muted/70 transition-colors flex items-center justify-center shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Centered search (clients) */}
          {profile === "cliente" ? (
            <button
              onClick={() => navigate("/cliente/busca")}
              className="flex-1 min-w-0 max-w-2xl mx-auto bg-muted hover:bg-muted/70 transition-colors rounded-xl px-3 sm:px-4 h-9 sm:h-10 flex items-center gap-2 sm:gap-3 text-left text-xs sm:text-sm text-muted-foreground"
            >
              <Search className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">Buscar produtos ou lojas</span>
            </button>
          ) : (
            <h1 className="flex-1 min-w-0 font-bold text-sm sm:text-base lg:text-lg truncate">
              {meta.label === "Lojista" ? "Painel da loja" : meta.label === "Admin" ? "Administração Vendy+" : "Central do entregador"}
            </h1>
          )}

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setNotificationsOpen((open) => !open)}
                className="size-9 sm:size-10 rounded-full bg-muted hover:bg-muted/70 transition-colors flex items-center justify-center relative"
                aria-label="Notificações"
                aria-expanded={notificationsOpen}
              >
              <Bell className="w-4 h-4" />
                {notificationsByProfile[profile].length > 0 && (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-secondary" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-card text-card-foreground shadow-elevated z-50 overflow-hidden">
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
                      <p className="text-sm font-semibold">Você não tem notificações</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {profile === "cliente" && (
              <Link
                to="/cliente/conversas"
                className="size-9 sm:size-10 rounded-full bg-muted hover:bg-muted/70 transition-colors flex items-center justify-center relative"
                aria-label="Conversas"
              >
                <MessageCircle className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </Link>
            )}
            {profile === "cliente" && (
              <Link
                to="/cliente/carrinho"
                className="size-9 sm:size-10 rounded-full bg-muted hover:bg-muted/70 transition-colors flex items-center justify-center relative"
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
            {/* Avatar / Sair */}
            {isDemo ? (
              <button
                onClick={() => { signOut(); navigate("/", { replace: true }); }}
                className="size-9 sm:size-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30"
                title="Sair do modo demonstração"
              >
                D
              </button>
            ) : authLoading ? (
              <div className="size-9 sm:size-10 rounded-full bg-muted animate-pulse" aria-hidden="true" />
            ) : user ? (
              <button
                onClick={() => { signOut(); navigate("/", { replace: true }); }}
                className="size-9 sm:size-10 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-bold text-sm shadow-card lg:hidden"
                title={`Sair — ${user.email}`}
              >
                {(user.email?.[0] ?? meta.initial).toUpperCase()}
              </button>
            ) : null}
            {/* Avatar desktop (link para perfil) */}
            {!isDemo && !authLoading && user && (
              <Link
                to={meta.profilePath}
                className="hidden lg:flex size-9 sm:size-10 rounded-full gradient-brand text-primary-foreground items-center justify-center font-bold text-sm shadow-card"
                title={user.email ?? meta.user}
              >
                {(user.email?.[0] ?? meta.initial).toUpperCase()}
              </Link>
            )}
          </div>
        </header>

        {/* Banner modo demonstração */}
        {isDemo && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">Modo Demonstração — dados fictícios para apresentação</span>
            </div>
            <button
              onClick={() => { signOut(); navigate("/lojista", { replace: true }); }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair do demo
            </button>
          </div>
        )}

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
