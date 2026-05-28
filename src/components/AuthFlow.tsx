import { useEffect, useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone, ShieldCheck, User, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImagePicker } from "@/components/ImagePicker";
import { AuthLayout } from "@/components/AuthLayout";
import { HOME_BY_ROLE } from "@/components/RequireRole";
import { toast } from "sonner";

type Field = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  maxLength?: number;
};

type AuthFlowProps = {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  finalPath: string;
  profileTitle: string;
  detailsTitle: string;
  detailsSubtitle: string;
  fields: Field[];
  allowSkip?: boolean;
  skipPath?: string;
};

/** Fluxo visível: tela de escolha → login direto OU cadastro por telefone */
type View = "choice" | "login" | "signup";

const defaultValues: Record<string, string> = {
  phone: "",
  code: "",
  name: "",
  email: "",
  password: "",
  cnpj: "",
  avatar: "",
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const AuthFlow = ({
  title,
  subtitle,
  icon: Icon,
  finalPath,
  profileTitle,
  detailsTitle,
  detailsSubtitle,
  fields,
  allowSkip,
  skipPath,
}: AuthFlowProps) => {
  /* ── vista atual ──────────────────────────────────────── */
  const [view, setView] = useState<View>("choice");

  /* ── fluxo de cadastro (signup) ───────────────────────── */
  const [step, setStep] = useState(0);
  const [signupMode, setSignupMode] = useState<"signup" | "login">("signup");
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [cnpjVerified, setCnpjVerified] = useState(false);

  /* ── fluxo de login direto ────────────────────────────── */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  /* ── compartilhado ────────────────────────────────────── */
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, role: userRole, loading } = useAuth();

  // Role esperado para esta tela de login (inferido do finalPath)
  const expectedRole = finalPath.startsWith("/lojista")
    ? "lojista"
    : finalPath.startsWith("/entregador")
      ? "entregador"
      : "cliente";

  useEffect(() => {
    if (loading || !session) return;
    // Navega assim que a sessão for confirmada.
    // Se o role já foi carregado e é diferente do esperado, vai para o home correto.
    // Se o role ainda é null (fetch em andamento), vai para finalPath e o RequireRole
    // gerenciará qualquer redirecionamento adicional quando o role carregar.
    const dest =
      userRole && userRole !== expectedRole
        ? HOME_BY_ROLE[userRole] ?? finalPath
        : finalPath;
    navigate(dest, { replace: true });
  }, [loading, session, userRole, expectedRole, navigate, finalPath]);

  const role = expectedRole;

  /* ── helpers signup ───────────────────────────────────── */
  const updateValue = (name: string, value: string) =>
    setValues((cur) => ({ ...cur, [name]: value.slice(0, 200) }));

  const verifyCnpj = async () => {
    const digits = onlyDigits(values.cnpj);
    if (digits.length !== 14) { toast.error("CNPJ precisa ter 14 dígitos"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-cnpj", { body: { cnpj: digits } });
      if (error || !data?.valid) throw new Error(data?.error || "CNPJ inválido");
      setCnpjVerified(true);
      toast.success(`Verificado: ${data.razaoSocial || data.nomeFantasia || "CNPJ válido"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível validar");
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (busy) return;

    if (step === 0) {
      const phone = onlyDigits(values.phone);
      if (phone.length < 10) { toast.error("Informe um telefone válido"); return; }
      setSignupMode("signup");
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!values.code || values.code.length < 4) { toast.error("Informe o código recebido"); return; }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!values.name?.trim()) { toast.error("Informe seu nome"); return; }
      if (!values.email?.trim()) { toast.error("Informe seu email"); return; }
      if (!isValidEmail(values.email)) { toast.error("Email inválido. Use o formato: seu@email.com"); return; }
      setStep(3);
      return;
    }

    if (!values.password || values.password.length < 6) {
      toast.error("Senha precisa de pelo menos 6 caracteres");
      return;
    }

    setBusy(true);
    try {
      if (signupMode === "login") {
        const phone = onlyDigits(values.phone);
        const { data: resolveData, error: resolveErr } = await supabase.functions.invoke("resolve-login", { body: { identifier: phone } });
        if (resolveErr || !resolveData?.email) throw new Error("Conta não encontrada");
        const { data: authData, error: signErr } = await supabase.auth.signInWithPassword({ email: resolveData.email, password: values.password });
        if (signErr) throw signErr;
        toast.success("Bem-vindo!");
        const userId = authData?.user?.id;
        if (userId) {
          const { data: p } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
          const actualRole = p?.role as string | null;
          navigate(actualRole && HOME_BY_ROLE[actualRole] ? HOME_BY_ROLE[actualRole] : finalPath, { replace: true });
        } else {
          navigate(finalPath, { replace: true });
        }
        return;
      } else {
        const phone = onlyDigits(values.phone);
        const extras: Record<string, string> = {};
        fields.forEach((f) => { if (values[f.name]) extras[f.name] = values[f.name]; });
        if (values.avatar) extras.avatar_url = values.avatar;
        const cnpjDigits = onlyDigits(values.cnpj);
        const signUpCall = supabase.auth.signUp({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: values.name, phone, role, avatar_url: values.avatar || undefined, extras },
          },
        });
        const signUpTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Tempo esgotado. Verifique sua conexão e tente novamente.")), 12000)
        );
        const { data: signUpResult, error: signErr } = await Promise.race([signUpCall, signUpTimeout]);
        if (signErr) throw signErr;

        if (!signUpResult?.session) {
          toast.info("Conta criada! Verifique seu email para ativar a conta e depois faça login.");
          return;
        }

        if (role === "lojista" && cnpjDigits && cnpjVerified) {
          await supabase.from("profiles").update({ cnpj: cnpjDigits, verified: true }).eq("id", signUpResult.session.user.id);
        }
        toast.success("Conta criada! Entrando...");
        navigate(finalPath, { replace: true });
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
      } else if (msg.toLowerCase().includes("email")) {
        toast.error("Email inválido. Verifique o endereço e tente novamente.");
      } else if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("weak")) {
        toast.error("Senha fraca. Use letras, números e símbolos.");
      } else {
        toast.error(msg || "Falha ao criar conta. Tente novamente.");
      }
    } finally {
      setBusy(false);
    }
  };

  /* ── login direto ─────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setLoginError("");
    setBusy(true);
    try {
      let email = loginEmail.trim();
      // Permite login por telefone também
      if (!email.includes("@")) {
        const { data, error } = await supabase.functions.invoke("resolve-login", { body: { identifier: email } });
        if (error || !data?.email) throw new Error("Conta não encontrada");
        email = data.email;
      }
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password: loginPassword });
      if (error) throw error;
      toast.success("Bem-vindo de volta!");
      const userId = authData.user?.id;
      if (userId) {
        const { data: p } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
        const actualRole = p?.role as string | null;
        navigate(actualRole && HOME_BY_ROLE[actualRole] ? HOME_BY_ROLE[actualRole] : finalPath, { replace: true });
      } else {
        navigate(finalPath, { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Credenciais inválidas";
      setLoginError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginEmail.trim();
    if (!email || !email.includes("@")) {
      setLoginError("Digite seu e-mail antes de redefinir a senha.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setResetSent(true);
      setLoginError("");
      toast.success("E-mail de redefinição enviado!");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Não foi possível enviar o e-mail");
    } finally {
      setBusy(false);
    }
  };

  /* ── variáveis de renderização do signup ──────────────── */
  const progress = ((step + 1) / 4) * 100;
  const showNameEmail = step === 2 && signupMode === "signup";
  const isFinal = step === 3;
  const isSellerSignupFinal = isFinal && signupMode === "signup" && role === "lojista";

  /* ══════════════════════════════════════════════════════
     VISTA: ESCOLHA
  ══════════════════════════════════════════════════════ */
  if (view === "choice") {
    return (
      <AuthLayout>
      <div className="px-6 py-10 max-w-md mx-auto">
        <Link to="/" className="size-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="mt-8 mb-10">
          <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-5">
            <Icon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <div className="space-y-3">
          {/* Entrar */}
          <button
            onClick={() => setView("login")}
            className="w-full gradient-brand text-primary-foreground rounded-2xl p-5 flex items-center gap-4 shadow-card hover:shadow-elevated transition-shadow text-left"
          >
            <div className="size-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">Entrar na conta</p>
              <p className="text-xs opacity-80 mt-0.5">Já tenho cadastro</p>
            </div>
          </button>

          {/* Criar conta */}
          <button
            onClick={() => setView("signup")}
            className="w-full bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-card hover:bg-muted/40 transition-colors text-left"
          >
            <div className="size-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">Criar nova conta</p>
              <p className="text-xs text-muted-foreground mt-0.5">Primeiro acesso</p>
            </div>
          </button>
        </div>

        {allowSkip && skipPath && (
          <Link
            to={skipPath}
            className="block text-center text-sm font-semibold text-muted-foreground py-3 mt-2 hover:text-foreground"
          >
            Continuar sem entrar
          </Link>
        )}

        <p className="text-center text-xs text-muted-foreground mt-10">
          Ao continuar você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
      </AuthLayout>
    );
  }

  /* ══════════════════════════════════════════════════════
     VISTA: LOGIN DIRETO
  ══════════════════════════════════════════════════════ */
  if (view === "login") {
    return (
      <AuthLayout>
      <div className="px-6 py-10 max-w-md mx-auto">
        <button
          onClick={() => { setView("choice"); setLoginError(""); setResetSent(false); }}
          className="size-10 rounded-full bg-muted flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="mt-8 mb-8">
          <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-5">
            <Icon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold">Entrar na conta</h1>
          <p className="text-sm text-muted-foreground mt-1">Informe suas credenciais para acessar.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          {/* E-mail */}
          <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Mail className="w-5 h-5 text-primary shrink-0" />
            <input
              value={loginEmail}
              onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
              placeholder="seu@email.com"
              type="email"
              required
              autoComplete="email"
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </label>

          {/* Senha */}
          <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Lock className="w-5 h-5 text-primary shrink-0" />
            <input
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
              placeholder="Sua senha"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </label>

          {/* Erro inline */}
          {loginError && (
            <p className="text-sm text-destructive font-semibold px-1">{loginError}</p>
          )}

          {/* Reset enviado */}
          {resetSent && (
            <p className="text-sm text-primary font-semibold px-1">
              ✓ E-mail de redefinição enviado. Verifique sua caixa de entrada.
            </p>
          )}

          {/* Esqueci minha senha */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={busy}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline disabled:opacity-60"
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? "Entrando..." : "Entrar"}
            {!busy && <LogIn className="w-4 h-4" />}
          </button>
        </form>

        {/* Alternar para cadastro */}
        <button
          onClick={() => { setView("signup"); setLoginError(""); }}
          className="w-full text-sm text-muted-foreground mt-5 hover:text-foreground text-center"
        >
          Não tem conta?{" "}
          <span className="font-bold text-primary">Criar conta</span>
        </button>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Ao continuar você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
      </AuthLayout>
    );
  }

  /* ══════════════════════════════════════════════════════
     VISTA: CADASTRO (fluxo original por telefone)
  ══════════════════════════════════════════════════════ */
  return (
    <AuthLayout>
    <div className="px-6 py-10 max-w-md mx-auto">
      <button
        onClick={() => step === 0 ? setView("choice") : setStep((s) => Math.max(0, s - 1))}
        className="size-10 rounded-full bg-muted flex items-center justify-center"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="mt-8">
        <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
          <div className="h-full gradient-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
        <h1 className="text-2xl font-extrabold">
          {step === 0 && "Criar nova conta"}
          {step === 1 && "Confirme seu número"}
          {step === 2 && profileTitle}
          {step === 3 && (signupMode === "login" ? "Entrar na sua conta" : detailsTitle)}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 0 && "Qual é o seu número de telefone?"}
          {step === 1 && `Digite o código enviado por SMS para ${values.phone || "seu número"}.`}
          {step === 2 && "Complete seus dados para personalizar sua experiência."}
          {step === 3 && (signupMode === "login" ? "Informe sua senha para continuar." : detailsSubtitle)}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {step === 0 && (
          <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Phone className="w-5 h-5 text-primary" />
            <input
              value={values.phone}
              onChange={(e) => updateValue("phone", e.target.value)}
              placeholder="(11) 9 9999-0000"
              inputMode="tel"
              maxLength={20}
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </label>
        )}

        {step === 1 && (
          <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Lock className="w-5 h-5 text-primary" />
            <input
              value={values.code}
              onChange={(e) => updateValue("code", e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              className="flex-1 bg-transparent text-lg font-bold tracking-[0.5em] text-center focus:outline-none"
            />
          </label>
        )}

        {showNameEmail && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <ImagePicker
                value={values.avatar}
                onChange={(url) => updateValue("avatar", url)}
                folder="avatar"
                shape="circle"
                label="Foto"
                className="w-24"
              />
            </div>
            <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
              <User className="w-5 h-5 text-primary" />
              <input
                value={values.name}
                onChange={(e) => updateValue("name", e.target.value)}
                placeholder="Nome completo"
                maxLength={80}
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
              />
            </label>
            <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
              <Mail className="w-5 h-5 text-primary" />
              <input
                value={values.email}
                onChange={(e) => updateValue("email", e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
                maxLength={120}
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
              />
            </label>
          </div>
        )}

        {isFinal && (
          <div className="space-y-3">
            {signupMode === "signup" &&
              fields.map((field) => (
                <label key={field.name} className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-1 shadow-card">
                  <span className="text-xs font-bold text-muted-foreground">{field.label}</span>
                  <input
                    value={values[field.name] || ""}
                    onChange={(e) => updateValue(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    type={field.type || "text"}
                    maxLength={field.maxLength || 120}
                    className="bg-transparent text-sm font-semibold focus:outline-none"
                  />
                </label>
              ))}

            {isSellerSignupFinal && (
              <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-card space-y-2">
                <span className="text-xs font-bold text-muted-foreground">CNPJ (selo verificado)</span>
                <div className="flex gap-2">
                  <input
                    value={values.cnpj}
                    onChange={(e) => { setCnpjVerified(false); updateValue("cnpj", e.target.value); }}
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                    maxLength={20}
                    className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={verifyCnpj}
                    disabled={busy || cnpjVerified}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
                  >
                    {cnpjVerified ? "✓ Verificado" : "Validar"}
                  </button>
                </div>
                {cnpjVerified && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> CNPJ validado — sua loja terá selo verificado.
                  </p>
                )}
                <Link to="/cliente/chat/suporte-verificacao" className="block text-xs text-muted-foreground underline pt-1">
                  Não tenho CNPJ — falar com administrador
                </Link>
              </div>
            )}

            <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
              <Lock className="w-5 h-5 text-primary" />
              <input
                value={values.password}
                onChange={(e) => updateValue("password", e.target.value)}
                placeholder="Crie uma senha"
                type="password"
                minLength={6}
                maxLength={120}
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
              />
            </label>
          </div>
        )}

        <button
          onClick={goNext}
          disabled={busy}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? "..." : isFinal ? (signupMode === "login" ? "Entrar" : "Criar conta") : "Continuar"}
          {isFinal && !busy && <CheckCircle2 className="w-4 h-4" />}
        </button>

        {allowSkip && step === 0 && skipPath && (
          <Link to={skipPath} className="block text-center text-sm font-semibold text-muted-foreground py-2 hover:text-foreground">
            Fazer login depois
          </Link>
        )}

        {/* Alternar para login direto */}
        <button
          onClick={() => setView("login")}
          className="w-full text-sm text-muted-foreground mt-1 hover:text-foreground text-center"
        >
          Já tem conta?{" "}
          <span className="font-bold text-primary">Entrar</span>
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-12">
        Ao continuar você concorda com nossos termos de uso e política de privacidade.
      </p>
    </div>
    </AuthLayout>
  );
};
