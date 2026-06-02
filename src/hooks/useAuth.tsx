import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "cliente" | "lojista" | "entregador" | "admin" | null;

type AuthCtx = {
  session: Session | null;
  user: User | null;
  /** Role primário (perfil principal do usuário) */
  role: UserRole;
  /** Todos os perfis que o usuário possui */
  roles: UserRole[];
  /** true enquanto sessão + perfis ainda estão sendo carregados */
  loading: boolean;
  /** true quando o usuário está navegando em modo demonstração */
  isDemo: boolean;
  /** Ativa o modo demonstração (sem login real no Supabase) */
  enterDemoMode: () => void;
  /** Desativa o modo demonstração e volta ao estado normal */
  exitDemoMode: () => void;
  signOut: () => Promise<void>;
  /** Re-busca os roles do banco — usar após adicionar um novo perfil */
  refreshRoles: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  role: null,
  roles: [],
  loading: true,
  isDemo: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
  signOut: async () => {},
  refreshRoles: async () => {},
});

type RolesResult = { role: UserRole; roles: UserRole[] };

const fetchRoles = async (userId: string): Promise<RolesResult> => {
  // Tenta buscar role + roles (array multi-perfil)
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, roles")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    const role = (data?.role as UserRole) ?? null;
    const raw = ((data?.roles as string[]) ?? []).filter(Boolean) as UserRole[];
    const roles: UserRole[] = role && !raw.includes(role) ? [role, ...raw] : raw;
    return { role, roles };
  } catch {
    // Coluna `roles` ainda não existe (migration pendente) — usa só `role`
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
  const [isDemo,  setIsDemo]  = useState(() => sessionStorage.getItem("__demo_mode") === "1");

  const enterDemoMode = () => { sessionStorage.setItem("__demo_mode", "1"); setIsDemo(true); };
  const exitDemoMode  = () => { sessionStorage.removeItem("__demo_mode"); setIsDemo(false); };

  // ── Inicialização: busca sessão e roles de forma sequencial ──────────
  // loading só vai a false quando AMBOS estiverem prontos, evitando
  // que AuthFlow/RequireRole tomem decisões com dados incompletos.
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

    // Escuta mudanças subsequentes (login, logout, refresh)
    // NÃO faz query de banco aqui — apenas atualiza a sessão.
    // O re-fetch de roles é disparado pelo useEffect abaixo.
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

  // ── Re-fetch de roles após mudança de usuário (pós-login) ───────────
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
