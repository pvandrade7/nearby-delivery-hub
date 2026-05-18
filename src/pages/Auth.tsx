import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon } from "lucide-react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/cliente/home";

  useEffect(() => {
    if (!loading && session) navigate(redirectTo, { replace: true });
  }, [loading, session, navigate, redirectTo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/cliente/home`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + redirectTo });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no Google");
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-10 max-w-md mx-auto">
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h1 className="text-2xl font-extrabold text-center">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Para conversar com vendedores</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="seu@email.com"
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Senha"
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button disabled={busy} type="submit"
            className="w-full gradient-brand text-primary-foreground rounded-xl py-3 font-bold shadow-card disabled:opacity-60">
            {busy ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button onClick={google} disabled={busy}
          className="w-full border border-border rounded-xl py-3 font-bold hover:bg-muted/50 disabled:opacity-60">
          Continuar com Google
        </button>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-sm text-muted-foreground mt-4 hover:text-foreground">
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
