import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: ReactNode;
  redirectTo?: string;
};

export const RequireAuth = ({ children, redirectTo = "/auth" }: Props) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!session) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
};
