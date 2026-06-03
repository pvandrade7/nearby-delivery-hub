import { useEffect, useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Mail, ShieldCheck, User, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImagePicker } from "@/components/ImagePicker";
import { AuthLayout } from "@/components/AuthLayout";
import { toast } from "sonner";

const DEMO_EMAIL    = "demo@gmail.com";
const DEMO_PASSWORD = "202020";

type Field = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  maxLength?: number;
  options?: string[];
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

type View = "choice" | "login" | "signup" | "addRole";

const defaultValues: Record<string, string> = {
  cnpj: "",
  avatar: "",
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isValidCnpj = (raw: string): boolean => {
  const d = onlyDigits(raw);
  if (d.length !== 14) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0; let w = len - 7;
    for (let i = 0; i < len; i++) { sum += parseInt(d[i]) * w--; if (w < 2) w = 9; }
    const r = sum % 11; return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
};

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

  /* ── campos do perfil compartilhados (signup + addRole) ── */
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [cnpjVerified, setCnpjVerified] = useState(false);
  const [otherSelected, setOtherSelected] = useState<Record<string, boolean>>({});

  /* ── signup simplificado ──────────────────────────────── */
  const [signupName,     setSignupName]     = useState("");
  const [signupEmail,    setSignupEmail]    = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError,    setSignupError]    = useState("");

  /* ── login direto ─────────────────────────────────────── */
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError,    setLoginError]    = useState("");
  const [resetSent,     setResetSent]     = useState(false);

  /* ── addRole preload ──────────────────────────────────── */
  const [preloadedFieldNames, setPreloadedFieldNames] = useState<Set<string>>(new Set());
  const [addRoleLoading,      setAddRoleLoading]      = useState(false);

  /* ── compartilhado ────────────────────────────────────── */
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, roles: userRoles, loading, enterDemoMode } = useAuth();

  const expectedRole = finalPath.startsWith("/lojista")
    ? "lojista"
    : finalPath.startsWith("/entregador")
      ? "entregador"
      : "cliente";

  const roleLabel =
    expectedRole === "lojista"    ? "Lojista" :
    expectedRole === "entregador" ? "Entregador" :
    "Cliente";

  const role = expectedRole;

  // ── Redireciona apenas quando o usuário já tem o perfil correto.
  // NUNCA auto-salta para "addRole" — essa tela só aparece após login/cadastro explícito.
  useEffect(() => {
    if (loading || !session) return;

    if (userRoles.includes("admin" as import("@/hooks/useAuth").UserRole)) {
      window.location.replace("/admin/painel");
      return;
    }

    if (!userRoles.includes(expectedRole as import("@/hooks/useAuth").UserRole)) {
      // Usuário autenticado mas sem este perfil → mantém na tela de escolha.
      // "addRole" só é ativado após o usuário entrar ou criar conta explicitamente.
      return;
    }

    // Já tem o perfil esperado → redireciona para a área correta.
    if (expectedRole === "lojista") {
      supabase.from("profiles")
        .select("extras, verified")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          const ext     = (data?.extras as Record<string, string>) ?? {};
          const isVerif = (data?.verified as boolean) ?? false;
          if (!isVerif) {
            window.location.replace("/lojista/verificacao");
          } else {
            window.location.replace(ext.storeName ? "/lojista/painel" : finalPath);
          }
        });
    } else {
      window.location.replace(finalPath);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, userRoles, expectedRole]);

  // ── Pré-carrega dados do perfil quando "addRole" é exibido.
  useEffect(() => {
    if (view !== "addRole" || !session?.user?.id) return;
    let cancelled = false;
    setAddRoleLoading(true);

    (async () => {
      const userId = session.user.id;
      const updates: Record<string, string> = {};
      const loadedNames: string[] = [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("extras")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled) {
        const ext = (profile?.extras as Record<string, string>) ?? {};
        fields.forEach((f) => {
          if (ext[f.name]) { updates[f.name] = ext[f.name]; loadedNames.push(f.name); }
        });
      }

      if (!cancelled && expectedRole === "cliente") {
        const { data: addr } = await supabase
          .from("addresses")
          .select("street, city, complement")
          .eq("user_id", userId)
          .eq("is_default", true)
          .maybeSingle();
        if (addr) {
          if (!updates.address   && addr.street)     { updates.address   = addr.street;     loadedNames.push("address"); }
          if (!updates.city      && addr.city)        { updates.city      = addr.city;        loadedNames.push("city"); }
          if (!updates.reference && addr.complement)  { updates.reference = addr.complement;  loadedNames.push("reference"); }
        }
      }

      if (!cancelled) {
        if (Object.keys(updates).length > 0) setValues((cur) => ({ ...cur, ...updates }));
        setPreloadedFieldNames(new Set(loadedNames));
        setAddRoleLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, session?.user?.id]);

  /* ── helpers ──────────────────────────────────────────── */
  const updateValue = (name: string, value: string) =>
    setValues((cur) => ({ ...cur, [name]: value.slice(0, 200) }));

  const verifyCnpj = () => {
    const raw = values.cnpj;
    if (onlyDigits(raw).length !== 14) { toast.error("CNPJ precisa ter 14 dígitos."); return; }
    if (!isValidCnpj(raw)) { toast.error("CNPJ inválido. Verifique os dígitos e tente novamente."); return; }
    setCnpjVerified(true);
    toast.success("CNPJ válido! Sua loja receberá o selo verificado.");
  };

  /* ── Cadastro ─────────────────────────────────────────── */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSignupError("");

    if (!signupName.trim()) { setSignupError("Informe seu nome."); return; }
    if (!signupEmail.trim() || !isValidEmail(signupEmail)) { setSignupError("E-mail inválido. Use o formato: seu@email.com"); return; }
    if (!signupPassword || signupPassword.length < 6) { setSignupError("A senha precisa ter pelo menos 6 caracteres."); return; }

    setBusy(true);
    try {
      const extras: Record<string, string> = {};
      fields.forEach((f) => { if (values[f.name]) extras[f.name] = values[f.name]; });
      if (values.avatar) extras.avatar_url = values.avatar;
      const cnpjDigits = onlyDigits(values.cnpj);

      const { data: signUpResult, error: signErr } = await supabase.auth.signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: signupName.trim(), role, avatar_url: values.avatar || undefined, extras },
        },
      });
      if (signErr) throw signErr;

      if (!signUpResult?.session) {
        toast.info("Conta criada! Verifique seu email para ativar a conta e depois faça login.");
        setView("login");
        return;
      }

      if (role === "lojista") {
        const profileUpdate: Record<string, unknown> = { extras };
        if (cnpjDigits && cnpjVerified) {
          profileUpdate.cnpj     = cnpjDigits;
          profileUpdate.verified = true;
        }
        await supabase.from("profiles")
          .update(profileUpdate)
          .eq("id", signUpResult.session.user.id);
      }

      if (role === "cliente" && (values.address || values.city)) {
        await supabase.from("addresses").insert({
          user_id:      signUpResult.session.user.id,
          label:        "Casa",
          street:       values.address   || "",
          number:       "",
          neighborhood: "",
          city:         values.city      || "",
          state:        "",
          zip_code:     "",
          complement:   values.reference || "",
          is_default:   true,
        });
      }

      toast.success("Conta criada! Entrando...");
      if (role === "lojista" && signUpResult.session?.user?.id) {
        sessionStorage.setItem(`new_signup_${signUpResult.session.user.id}`, "1");
      }
      window.location.replace(finalPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const raw = msg.toLowerCase();
      if (raw.includes("already registered") || raw.includes("already been registered") || raw.includes("user already registered")) {
        setSignupError("Este e-mail já está cadastrado. Use a opção de Entrar.");
      } else if (raw.includes("invalid email") || (raw.includes("email") && raw.includes("invalid"))) {
        setSignupError("E-mail inválido. Verifique o endereço e tente novamente.");
      } else if (raw.includes("password") || raw.includes("weak") || raw.includes("senha")) {
        setSignupError("Senha fraca. Use pelo menos 6 caracteres com letras e números.");
      } else if (raw.includes("network") || raw.includes("fetch") || raw.includes("failed to fetch")) {
        setSignupError("Sem conexão com o servidor. Verifique sua internet e tente novamente.");
      } else if (raw.includes("rate limit") || raw.includes("too many")) {
        setSignupError("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.");
      } else {
        setSignupError(msg || "Falha ao criar conta. Tente novamente.");
      }
    } finally {
      setBusy(false);
    }
  };

  /* ── Login direto ─────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setLoginError("");

    if (!loginEmail.trim()) { setLoginError("Informe seu e-mail para continuar."); return; }
    if (!loginPassword)     { setLoginError("Informe sua senha para continuar."); return; }
    if (loginPassword.length < 6) { setLoginError("Senha deve ter pelo menos 6 caracteres."); return; }

    if (
      loginEmail.trim().toLowerCase() === DEMO_EMAIL &&
      loginPassword.trim() === DEMO_PASSWORD
    ) {
      enterDemoMode();
      window.location.replace("/lojista/painel");
      return;
    }

    setBusy(true);
    try {
      let email = loginEmail.trim();
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
        const { data: p } = await supabase.from("profiles").select("role, roles, extras, verified").eq("id", userId).maybeSingle();
        const primaryRole = (p?.role as string | null) ?? null;
        const rolesArr    = ((p?.roles as string[]) ?? []).filter(Boolean);
        const allRoles    = primaryRole && !rolesArr.includes(primaryRole) ? [primaryRole, ...rolesArr] : rolesArr;

        if (allRoles.includes("admin")) {
          window.location.replace("/admin/painel");
        } else if (allRoles.includes(expectedRole)) {
          const ext     = (p?.extras as Record<string, string>) ?? {};
          const isVerif = (p?.verified as boolean) ?? false;
          if (expectedRole === "lojista" && !isVerif) {
            window.location.replace("/lojista/verificacao");
          } else if (expectedRole === "lojista") {
            window.location.replace(ext.storeName ? "/lojista/painel" : finalPath);
          } else {
            window.location.replace(finalPath);
          }
        } else {
          // Conta sem este perfil → ativar perfil
          setView("addRole");
        }
      } else {
        window.location.replace(finalPath);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message.toLowerCase() : "";
      if (raw.includes("invalid login") || raw.includes("invalid credentials") || raw.includes("invalid email or password")) {
        setLoginError("E-mail ou senha incorretos. Verifique e tente novamente.");
      } else if (raw.includes("email not confirmed")) {
        setLoginError("E-mail ainda não confirmado. Verifique sua caixa de entrada.");
      } else if (raw.includes("too many requests") || raw.includes("rate limit")) {
        setLoginError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else if (raw.includes("network") || raw.includes("fetch")) {
        setLoginError("Sem conexão com a internet. Verifique sua rede.");
      } else if (raw.includes("conta não encontrada") || raw.includes("not found")) {
        setLoginError("Conta não encontrada. Verifique o e-mail ou crie uma conta.");
      } else {
        setLoginError("Não foi possível entrar. Verifique suas credenciais e tente novamente.");
      }
    } finally {
      setBusy(false);
    }
  };

  /* ── Adicionar perfil complementar ───────────────────────── */
  const handleAddRole = async () => {
    if (!session?.user?.id) return;
    setBusy(true);
    try {
      const userId = session.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("extras, role, roles")
        .eq("id", userId)
        .maybeSingle();

      const newExtras: Record<string, string> = {};
      fields.forEach((f) => { if (values[f.name]) newExtras[f.name] = values[f.name]; });
      const mergedExtras = { ...((profile?.extras as Record<string, string>) ?? {}), ...newExtras };

      const currentPrimary = (profile?.role as string | null) ?? null;
      const currentArr     = ((profile?.roles as string[]) ?? []).filter(Boolean);
      const baseRoles      = currentPrimary && !currentArr.includes(currentPrimary)
        ? [currentPrimary, ...currentArr]
        : currentArr;
      const newRoles   = baseRoles.includes(expectedRole) ? baseRoles : [...baseRoles, expectedRole];
      const newPrimary = currentPrimary ?? expectedRole;

      const { error: errWithRoles } = await supabase
        .from("profiles")
        .update({ roles: newRoles, role: newPrimary, extras: mergedExtras })
        .eq("id", userId);

      if (errWithRoles) {
        const { error: errFallback } = await supabase
          .from("profiles")
          .update({ role: newPrimary, extras: mergedExtras })
          .eq("id", userId);
        if (errFallback) throw errFallback;
      }

      if (expectedRole === "cliente" && (values.address || values.city)) {
        const { data: existingAddr } = await supabase
          .from("addresses")
          .select("id")
          .eq("user_id", userId)
          .eq("is_default", true)
          .maybeSingle();
        if (!existingAddr) {
          await supabase.from("addresses").insert({
            user_id:      userId,
            label:        "Casa",
            street:       values.address   || "",
            number:       "",
            neighborhood: "",
            city:         values.city      || "",
            state:        "",
            zip_code:     "",
            complement:   values.reference || "",
            is_default:   true,
          });
        }
      }

      const cnpjDigits = onlyDigits(values.cnpj);
      if (expectedRole === "lojista" && cnpjDigits && cnpjVerified) {
        await supabase.from("profiles").update({ cnpj: cnpjDigits, verified: true }).eq("id", userId);
      }

      toast.success(`Perfil de ${roleLabel} ativado com sucesso!`);

      const destination =
        expectedRole === "lojista" && mergedExtras.storeName
          ? "/lojista/painel"
          : finalPath;
      window.location.replace(destination);
    } catch (err) {
      console.error("[AuthFlow] handleAddRole:", err);
      toast.error("Erro ao ativar perfil. Verifique sua conexão e tente novamente.");
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

  /* ── renderField ────────────────────────────────────────── */
  const renderField = (field: Field, prefilled = false) => {
    if (!field.options?.length) {
      return (
        <label
          key={field.name}
          className={`rounded-xl px-4 py-3 flex flex-col gap-1 shadow-card border ${
            prefilled ? "bg-muted/60 border-border" : "bg-card border-border"
          }`}
        >
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            {prefilled && <CheckCircle2 className="w-3 h-3 text-primary" />}
            {field.label}
          </span>
          <input
            value={values[field.name] || ""}
            onChange={(e) => updateValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            type={field.type || "text"}
            maxLength={field.maxLength || 120}
            className="bg-transparent text-sm font-semibold focus:outline-none"
          />
        </label>
      );
    }

    const currentValue = values[field.name] || "";
    const inList       = field.options.includes(currentValue);
    const isOther      = otherSelected[field.name] || (!inList && currentValue !== "");

    const selectOption = (opt: string) => {
      setOtherSelected((prev) => ({ ...prev, [field.name]: false }));
      updateValue(field.name, opt);
    };
    const selectOther = () => {
      setOtherSelected((prev) => ({ ...prev, [field.name]: true }));
      if (inList) updateValue(field.name, "");
    };

    return (
      <div key={field.name} className="bg-card border border-border rounded-xl px-4 py-3 shadow-card space-y-3">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          {prefilled && <CheckCircle2 className="w-3 h-3 text-primary" />}
          {field.label}
        </span>
        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => selectOption(opt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                inList && currentValue === opt
                  ? "bg-primary text-primary-foreground border-primary shadow-card"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
              }`}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            onClick={selectOther}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isOther
                ? "bg-primary text-primary-foreground border-primary shadow-card"
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
            }`}
          >
            Outro
          </button>
        </div>
        {isOther && (
          <input
            value={currentValue}
            onChange={(e) => updateValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength || 120}
            autoFocus
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
        {inList && (
          <p className="text-xs text-primary font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {currentValue}
          </p>
        )}
      </div>
    );
  };

  /* ── Spinner enquanto o estado de auth está sendo determinado ── */
  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  /* ══════════════════════════════════════════════════════
     VISTA: ADICIONAR PERFIL (usuário já logado, sem o perfil esperado)
  ══════════════════════════════════════════════════════ */
  if (view === "addRole") {
    const prefilledFields = fields.filter((f) => preloadedFieldNames.has(f.name));
    const emptyFields     = fields.filter((f) => !preloadedFieldNames.has(f.name));
    const allPrefilled    = fields.length > 0 && emptyFields.length === 0;

    return (
      <AuthLayout>
        <div className="px-6 py-10 max-w-md mx-auto w-full">
          <button
            onClick={() => navigate(-1)}
            className="size-10 rounded-full bg-muted flex items-center justify-center mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="mb-8">
            <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-4">
              <Icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-bold mb-3">
              <CheckCircle2 className="w-3 h-3" /> Você já tem uma conta Vendy+
            </div>
            <h1 className="text-2xl font-extrabold">Ativar perfil de {roleLabel}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {allPrefilled
                ? "Seus dados já estão salvos. Confirme para ativar o perfil."
                : "Preencha apenas as informações exclusivas deste perfil. Todos os demais dados já foram importados da sua conta."}
            </p>
          </div>

          {addRoleLoading ? (
            <div className="space-y-3">
              {fields.map((f) => (
                <div key={f.name} className="bg-card border border-border rounded-xl px-4 py-5 shadow-card animate-pulse">
                  <div className="h-2.5 w-24 bg-muted rounded mb-2" />
                  <div className="h-4 w-40 bg-muted rounded" />
                </div>
              ))}
              <div className="h-12 rounded-xl bg-muted animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              {prefilledFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
                    Dados já cadastrados
                  </p>
                  {prefilledFields.map((field) => renderField(field, true))}
                </div>
              )}
              {emptyFields.length > 0 && (
                <div className="space-y-2">
                  {prefilledFields.length > 0 && (
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1 pt-2">
                      Informações adicionais
                    </p>
                  )}
                  {emptyFields.map((field) => renderField(field, false))}
                </div>
              )}

              {expectedRole === "lojista" && (
                <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-card space-y-2">
                  <span className="text-xs font-bold text-muted-foreground">CNPJ (opcional — ativa selo verificado)</span>
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
                      {cnpjVerified ? "✓ OK" : "Validar"}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleAddRole}
                disabled={busy}
                className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                {busy ? "Ativando..." : allPrefilled ? `Confirmar e ativar ${roleLabel}` : `Ativar perfil de ${roleLabel}`}
                {!busy && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Você poderá alternar entre seus perfis a qualquer momento.
              </p>
            </div>
          )}
        </div>
      </AuthLayout>
    );
  }

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
     VISTA: LOGIN
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

          <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Lock className="w-5 h-5 text-primary shrink-0" />
            <input
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
              placeholder="Sua senha"
              type="password"
              required
              autoComplete="current-password"
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </label>

          {loginError && (
            <p className="text-sm text-destructive font-semibold px-1">{loginError}</p>
          )}
          {resetSent && (
            <p className="text-sm text-primary font-semibold px-1">
              ✓ E-mail de redefinição enviado. Verifique sua caixa de entrada.
            </p>
          )}

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

          <button
            type="submit"
            disabled={busy}
            className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? "Entrando..." : "Entrar"}
            {!busy && <LogIn className="w-4 h-4" />}
          </button>
        </form>

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
     VISTA: CADASTRO
  ══════════════════════════════════════════════════════ */
  return (
    <AuthLayout>
    <div className="px-6 py-10 max-w-md mx-auto">
      <button
        onClick={() => { setView("choice"); setSignupError(""); }}
        className="size-10 rounded-full bg-muted flex items-center justify-center"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="mt-8 mb-8">
        <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold">Criar nova conta</h1>
        <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para começar.</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-3">
        {/* Foto (opcional) */}
        <div className="flex justify-center mb-2">
          <ImagePicker
            value={values.avatar}
            onChange={(url) => updateValue("avatar", url)}
            folder="avatar"
            shape="circle"
            label="Foto"
            className="w-24"
          />
        </div>

        {/* Nome */}
        <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
          <User className="w-5 h-5 text-primary shrink-0" />
          <input
            value={signupName}
            onChange={(e) => { setSignupName(e.target.value); setSignupError(""); }}
            placeholder="Nome completo"
            required
            autoComplete="name"
            maxLength={80}
            className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
          />
        </label>

        {/* E-mail */}
        <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
          <Mail className="w-5 h-5 text-primary shrink-0" />
          <input
            value={signupEmail}
            onChange={(e) => { setSignupEmail(e.target.value); setSignupError(""); }}
            placeholder="seu@email.com"
            type="email"
            required
            autoComplete="email"
            className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
          />
        </label>

        {/* Campos específicos do perfil */}
        {fields.length > 0 && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
              {role === "lojista" ? "Sobre sua loja" : role === "entregador" ? "Seus dados de entregador" : "Endereço de entrega"}
            </p>
            {fields.map((field) => renderField(field, false))}
          </div>
        )}

        {/* Senha */}
        <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
          <Lock className="w-5 h-5 text-primary shrink-0" />
          <input
            value={signupPassword}
            onChange={(e) => { setSignupPassword(e.target.value); setSignupError(""); }}
            placeholder="Crie uma senha (mín. 6 caracteres)"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
          />
        </label>

        {/* CNPJ (somente lojistas) */}
        {role === "lojista" && (
          <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-card space-y-2">
            <span className="text-xs font-bold text-muted-foreground">CNPJ (opcional — ativa selo verificado)</span>
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
                {cnpjVerified ? "✓ OK" : "Validar"}
              </button>
            </div>
            {cnpjVerified && (
              <p className="text-xs text-primary flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> CNPJ validado — sua loja terá selo verificado imediatamente.
              </p>
            )}
          </div>
        )}

        {/* Erro */}
        {signupError && (
          <p className="text-sm text-destructive font-semibold px-1">{signupError}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? "Criando conta..." : "Criar conta"}
          {!busy && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </form>

      <button
        onClick={() => { setView("login"); setSignupError(""); }}
        className="w-full text-sm text-muted-foreground mt-5 hover:text-foreground text-center"
      >
        Já tem conta?{" "}
        <span className="font-bold text-primary">Entrar</span>
      </button>

      <p className="text-center text-xs text-muted-foreground mt-10">
        Ao continuar você concorda com nossos termos de uso e política de privacidade.
      </p>
    </div>
    </AuthLayout>
  );
};
