import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/components/RequireRole";
import { AuthLayout } from "@/components/AuthLayout";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, LogIn } from "lucide-react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, role } = useAuth();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/cliente/home";

  // Infere o role pelo caminho de origem (usado no cadastro)
  const inferredRole = redirectTo.startsWith("/lojista")
    ? "lojista"
    : redirectTo.startsWith("/entregador")
      ? "entregador"
      : "cliente";

  useEffect(() => {
    if (loading || !session || role === null) return;
    navigate(HOME_BY_ROLE[role] ?? redirectTo, { replace: true });
  }, [loading, session, role, navigate, redirectTo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/cliente/home`,
            data: { display_name: name || email.split("@")[0], role: inferredRole },
          },
        });
        if (err) throw err;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        let loginEmail = email.trim();
        if (!loginEmail.includes("@")) {
          const { data, error: resErr } = await supabase.functions.invoke("resolve-login", {
            body: { identifier: loginEmail },
          });
          if (resErr || !data?.email) throw new Error("Conta não encontrada");
          loginEmail = data.email;
        }
        const { error: err } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (err) throw err;
        toast.success("Bem-vindo de volta!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação");
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
    <AuthLayout>
      <div className="px-6 py-10 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-extrabold">
          {mode === "login" ? "Entrar na conta" : "Criar conta"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login" ? "Informe suas credenciais para acessar." : "Preencha os dados para criar sua conta."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
              <UserIcon className="w-5 h-5 text-primary shrink-0" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
              />
            </label>
          )}

          <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Mail className="w-5 h-5 text-primary shrink-0" />
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              required
              placeholder={mode === "login" ? "seu@email.com ou telefone" : "seu@email.com"}
              type="email"
              autoComplete="email"
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </label>

          <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Lock className="w-5 h-5 text-primary shrink-0" />
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              type="password"
              required
              minLength={6}
              placeholder="Senha"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </label>

          {/* Erro inline */}
          {error && (
            <p className="text-sm text-destructive font-semibold px-1">{error}</p>
          )}

          <button
            disabled={busy}
            type="submit"
            className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
            {!busy && <LogIn className="w-4 h-4" />}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={google}
          disabled={busy}
          className="w-full bg-card border border-border rounded-xl py-3 font-bold hover:bg-muted/50 transition-colors disabled:opacity-60"
        >
          Continuar com Google
        </button>

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          className="w-full text-sm text-muted-foreground mt-4 hover:text-foreground text-center"
        >
          {mode === "login"
            ? <>Não tem conta? <span className="font-bold text-primary">Cadastre-se</span></>
            : <>Já tem conta? <span className="font-bold text-primary">Entrar</span></>
          }
        </button>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Ao continuar você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </AuthLayout>
  );
};

export default Auth;
