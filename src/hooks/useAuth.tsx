import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "cliente" | "lojista" | "entregador" | "admin" | null;

type AuthCtx = {
  session:         Session | null;
  user:            User | null;
  role:            UserRole;
  roles:           UserRole[];
  verified:        boolean;
  loading:         boolean;
  isDemo:          boolean;
  enterDemoMode:   () => void;
  exitDemoMode:    () => void;
  signOut:         () => Promise<void>;
  refreshRoles:    () => Promise<void>;
  refreshVerified: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session:         null,
  user:            null,
  role:            null,
  roles:           [],
  verified:        false,
  loading:         true,
  isDemo:          false,
  enterDemoMode:   () => {},
  exitDemoMode:    () => {},
  signOut:         async () => {},
  refreshRoles:    async () => {},
  refreshVerified: async () => {},
});

type RolesResult = { role: UserRole; roles: UserRole[]; verified: boolean };

const fetchRoles = async (userId: string): Promise<RolesResult> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, roles, verified")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    const role     = (data?.role as UserRole) ?? null;
    const raw      = ((data?.roles as string[]) ?? []).filter(Boolean) as UserRole[];
    const roles: UserRole[] = role && !raw.includes(role) ? [role, ...raw] : raw;
    const verified = (data?.verified as boolean) ?? false;
    return { role, roles, verified };
  } catch {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role, verified")
        .eq("id", userId)
        .maybeSingle();
      const role = (data?.role as UserRole) ?? null;
      return { role, roles: role ? [role] : [], verified: (data?.verified as boolean) ?? false };
    } catch (e2) {
      console.error("[useAuth] fetchRoles falhou:", e2);
      return { role: null, roles: [], verified: false };
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session,  setSession]  = useState<Session | null>(null);
  const [role,     setRole]     = useState<UserRole>(null);
  const [roles,    setRoles]    = useState<UserRole[]>([]);
  const [verified, setVerified] = useState(false);
  const [loading,  setLoading]  = useState(true);

  // Demo mode: persiste no sessionStorage para sobreviver a reloads via window.location.replace.
  // Limpo ao fechar o browser (sessionStorage) ou ao clicar em "Sair do demo".
  const [isDemo, setIsDemo] = useState(() => sessionStorage.getItem("__demo_mode") === "1");

  const enterDemoMode = () => { sessionStorage.setItem("__demo_mode", "1"); setIsDemo(true); };
  const exitDemoMode  = () => { sessionStorage.removeItem("__demo_mode");  setIsDemo(false); };

  // Inicialização: busca sessão real do Supabase
  useEffect(() => {
    let mounted = true;
    const fallback = setTimeout(() => { if (mounted) setLoading(false); }, 5000);

    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(fallback);
      if (!mounted) return;
      const s = data.session ?? null;
      setSession(s);
      if (s?.user?.id) {
        const result = await fetchRoles(s.user.id);
        if (mounted) { setRole(result.role); setRoles(result.roles); setVerified(result.verified); }
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      clearTimeout(fallback);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (!s) { setRole(null); setRoles([]); setVerified(false); }
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  // Re-fetch após mudança de usuário
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    fetchRoles(session.user.id).then((result) => {
      if (!cancelled) { setRole(result.role); setRoles(result.roles); setVerified(result.verified); }
    });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const refreshRoles = async () => {
    if (!session?.user?.id) return;
    const result = await fetchRoles(session.user.id);
    setRole(result.role);
    setRoles(result.roles);
    setVerified(result.verified);
  };

  const refreshVerified = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from("profiles")
      .select("verified")
      .eq("id", session.user.id)
      .maybeSingle();
    setVerified((data?.verified as boolean) ?? false);
  };

  const signOut = async () => {
    exitDemoMode();
    setSession(null);
    setRole(null);
    setRoles([]);
    setVerified(false);
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{
      session,
      user:    session?.user ?? null,
      role,
      roles,
      verified,
      loading,
      isDemo,
      enterDemoMode,
      exitDemoMode,
      signOut,
      refreshRoles,
      refreshVerified,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
