import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/cliente", icon: Home, label: "Início" },
  { to: "/cliente/busca", icon: Search, label: "Buscar" },
  { to: "/cliente/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { to: "/cliente/perfil", icon: User, label: "Perfil" },
];

export const ClientTabBar = () => {
  const location = useLocation();
  const { count } = useCart();

  return (
    <nav className="sticky bottom-0 inset-x-0 bg-background border-t border-border px-2 pt-2 pb-3 flex justify-around z-30">
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        const showBadge = label === "Pedidos" && count > 0;
        return (
          <RouterNavLink
            key={to}
            to={to}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
            <span className="text-[10px] font-semibold">{label}</span>
            {showBadge && (
              <span className="absolute top-0 right-2 size-4 bg-secondary text-secondary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </RouterNavLink>
        );
      })}
    </nav>
  );
};
