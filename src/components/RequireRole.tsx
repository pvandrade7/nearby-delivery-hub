import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";

export const HOME_BY_ROLE: Record<string, string> = {
  cliente:    "/cliente/home",
  lojista:    "/lojista/painel",
  entregador: "/entregador/painel",
  admin:      "/admin/verificacoes",
};

type Props = {
  children: ReactNode;
  role: UserRole | UserRole[];
  redirectTo?: string;
};

/**
 * Guard duplo: verifica autenticação E role.
 * - Não autenticado  → redireciona para redirectTo (login do perfil)
 * - Role errado       → redireciona para a home do próprio role do usuário
 * - OK                → renderiza children
 */
export const RequireRole = ({ children, role, redirectTo = "/auth" }: Props) => {
  const { session, role: userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen gap-3 text-sm text-muted-foreground">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  const allowed = (Array.isArray(role) ? role : [role]) as string[];

  if (userRole && !allowed.includes(userRole)) {
    return <Navigate to={HOME_BY_ROLE[userRole] ?? "/"} replace />;
  }

  return <>{children}</>;
};
