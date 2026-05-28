import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "cliente" | "lojista" | "entregador" | "admin" | null;

type AuthCtx = {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

const fetchRole = async (userId: string): Promise<UserRole> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data?.role as UserRole) ?? null;
  } catch (e) {
    console.error("[useAuth] fetchRole falhou:", e);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // Inicialização: busca sessão + escuta mudanças de auth
  useEffect(() => {
    let mounted = true;

    // Fallback: desbloqueia UI após 5s caso Supabase não responda
    const fallback = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    // Busca sessão inicial (fonte autoritativa do estado de auth)
    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(fallback);
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    }).catch(() => {
      clearTimeout(fallback);
      if (mounted) setLoading(false);
    });

    // Escuta mudanças de auth (login, logout, refresh de token)
    // NÃO fazemos queries de banco aqui — apenas atualizamos a sessão.
    // O fetch do role acontece num useEffect separado, reagindo à mudança de user ID.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (!s) setRole(null);
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  // Busca o role sempre que o usuário autenticado mudar
  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;
    fetchRole(session.user.id).then((r) => {
      if (!cancelled) setRole(r);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signOut = async () => {
    setSession(null);
    setRole(null);
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, role, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
