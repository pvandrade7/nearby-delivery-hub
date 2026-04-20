import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/lojista/painel", icon: LayoutDashboard, label: "Painel" },
  { to: "/lojista/produtos", icon: Package, label: "Produtos" },
  { to: "/lojista/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { to: "/lojista/config", icon: Settings, label: "Conta" },
];

export const SellerTabBar = () => {
  const location = useLocation();
  return (
    <nav className="sticky bottom-0 inset-x-0 bg-background border-t border-border px-2 pt-2 pb-3 flex justify-around z-30">
      {tabs.map((t) => {
        const active = location.pathname === t.to;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <t.icon className={cn("w-5 h-5", active && "scale-110")} />
            <span className="text-[10px] font-semibold">{t.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
