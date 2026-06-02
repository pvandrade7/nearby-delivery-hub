import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "cliente" | "lojista" | "entregador" | "admin" | null;

type AuthCtx = {
  session:      Session | null;
  user:         User | null;
  role:         UserRole;
  roles:        UserRole[];
  loading:      boolean;
  isDemo:       boolean;
  enterDemoMode:  () => void;
  exitDemoMode:   () => void;
  signOut:        () => Promise<void>;
  refreshRoles:   () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session:       null,
  user:          null,
  role:          null,
  roles:         [],
  loading:       true,
  isDemo:        false,
  enterDemoMode: () => {},
  exitDemoMode:  () => {},
  signOut:       async () => {},
  refreshRoles:  async () => {},
});

type RolesResult = { role: UserRole; roles: UserRole[] };

const fetchRoles = async (userId: string): Promise<RolesResult> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, roles")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    const role  = (data?.role as UserRole) ?? null;
    const raw   = ((data?.roles as string[]) ?? []).filter(Boolean) as UserRole[];
    const roles: UserRole[] = role && !raw.includes(role) ? [role, ...raw] : raw;
    return { role, roles };
  } catch {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      const role = (data?.role as UserRole) ?? null;
      return { role, roles: role ? [role] : [] };
    } catch (e2) {
      console.error("[useAuth] fetchRoles falhou:", e2);
      return { role: null, roles: [] };
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role,    setRole]    = useState<UserRole>(null);
  const [roles,   setRoles]   = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Demo mode: APENAS em memória. Nunca automático, nunca via URL param.
  // Só é ativado quando o usuário clica explicitamente no botão "Modo Demo".
  // Resetado ao fechar/recarregar a página — sem persistência.
  const [isDemo, setIsDemo] = useState(false);

  // Na inicialização: garante que qualquer resíduo no sessionStorage seja apagado.
  useEffect(() => {
    sessionStorage.removeItem("__demo_mode");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enterDemoMode = () => setIsDemo(true);
  const exitDemoMode  = () => setIsDemo(false);

  // ── Inicialização: busca sessão real do Supabase ─────────────────────
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
        if (mounted) { setRole(result.role); setRoles(result.roles); }
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      clearTimeout(fallback);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (!s) { setRole(null); setRoles([]); }
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  // ── Re-fetch de roles após mudança de usuário (pós-login) ────────────
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    fetchRoles(session.user.id).then((result) => {
      if (!cancelled) { setRole(result.role); setRoles(result.roles); }
    });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const refreshRoles = async () => {
    if (!session?.user?.id) return;
    const result = await fetchRoles(session.user.id);
    setRole(result.role);
    setRoles(result.roles);
  };

  const signOut = async () => {
    exitDemoMode();
    setSession(null);
    setRole(null);
    setRoles([]);
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{
      session,
      user: session?.user ?? null,
      role,
      roles,
      loading,
      isDemo,
      enterDemoMode,
      exitDemoMode,
      signOut,
      refreshRoles,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
