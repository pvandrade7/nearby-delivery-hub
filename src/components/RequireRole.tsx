import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";

export const HOME_BY_ROLE: Record<string, string> = {
  cliente:    "/cliente/home",
  lojista:    "/lojista/painel",
  entregador: "/entregador/painel",
  admin:      "/admin/verificacoes",
};

/** Página de login/onboarding de cada perfil (para redirecionar ao adicionar role) */
export const LOGIN_BY_ROLE: Record<string, string> = {
  cliente:    "/cliente",
  lojista:    "/lojista",
  entregador: "/entregador",
};

type Props = {
  children: ReactNode;
  role: UserRole | UserRole[];
  redirectTo?: string;
};

/**
 * Guard de autenticação + perfil para múltiplos roles.
 *
 * Comportamento:
 * - Não autenticado       → redireciona para `redirectTo` (tela de login)
 * - Sem o perfil exigido  → redireciona para a página de adição de perfil
 *   (ex.: /entregador), que mostrará o fluxo de onboarding complementar
 * - Perfil encontrado     → renderiza children
 */
export const RequireRole = ({ children, role, redirectTo = "/auth" }: Props) => {
  const { session, roles, loading } = useAuth();
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

  // Verifica se o usuário possui ALGUM dos roles permitidos no array de perfis
  const hasRole = roles.some((r) => r && allowed.includes(r));

  if (!hasRole) {
    // Usuário está logado mas não tem o perfil necessário.
    // Redireciona para a tela de login/onboarding do perfil exigido,
    // que mostrará o formulário de adição de perfil complementar.
    const targetRole = allowed[0];
    const addRolePage = targetRole ? (LOGIN_BY_ROLE[targetRole] ?? redirectTo) : redirectTo;
    return <Navigate to={addRolePage} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
