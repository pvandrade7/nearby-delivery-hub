import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "cliente" | "lojista" | "entregador" | "admin" | null;

type AuthCtx = {
  session: Session | null;
  user: User | null;
  role: UserRole;          // perfil persistido no banco
  loading: boolean;        // true até auth + profile estarem resolvidos
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

/** Busca o role do perfil do usuário no banco */
const fetchRole = async (userId: string): Promise<UserRole> => {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as UserRole) ?? null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fallback: se o Supabase não responder em 5s (projeto pausado), desbloqueia a UI
    const fallback = setTimeout(() => setLoading(false), 5000);

    // 1) Busca sessão no servidor + role no banco — estado inicial autoritativo
    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(fallback);
      const s = data.session;
      setSession(s);
      if (s?.user) {
        const r = await fetchRole(s.user.id);
        setRole(r);
      }
      setLoading(false);
    }).catch(() => {
      clearTimeout(fallback);
      setLoading(false);
    });

    // 2) Escuta mudanças subsequentes (login, logout, refresh de token)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        const r = await fetchRole(s.user.id);
        setRole(r);
      } else {
        setRole(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setSession(null);   // limpa imediatamente antes do redirect
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
