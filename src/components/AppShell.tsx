import { ReactNode } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { Link, useLocation } from "react-router-dom";
import { Users } from "lucide-react";

/**
 * Wraps every prototype screen in a phone-like frame and offers a
 * floating role switcher so reviewers can hop between perfis.
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const showSwitcher = location.pathname !== "/";

  return (
    <MobileFrame>
      {children}
      {showSwitcher && (
        <Link
          to="/"
          aria-label="Trocar de perfil"
          className="absolute bottom-20 right-3 md:bottom-24 md:right-4 size-11 rounded-full gradient-brand text-primary-foreground shadow-elevated flex items-center justify-center z-40 active:scale-90 transition-transform"
        >
          <Users className="w-5 h-5" />
        </Link>
      )}
    </MobileFrame>
  );
};
