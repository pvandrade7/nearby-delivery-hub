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
  /** Lista de opções para renderizar como chips selecionáveis. Inclui "Outro" automático. */
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

/** Fluxo visível: tela de escolha → login direto OU cadastro por telefone OU adição de perfil */
type View = "choice" | "login" | "signup" | "addRole";

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

/** Valida CNPJ pelo algoritmo oficial da Receita Federal (dígitos verificadores). */
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

  /* ── seletor de opções (campos com options[]) ────────────── */
  // Rastreia quais campos têm "Outro" selecionado (valor não está na lista de options)
  const [otherSelected, setOtherSelected] = useState<Record<string, boolean>>({});

  // Conjunto congelado: quais campos foram pré-preenchidos a partir do banco.
  // Não muda enquanto o usuário digita — evita que campos "saltem" de seção.
  const [preloadedFieldNames, setPreloadedFieldNames] = useState<Set<string>>(new Set());

  /* ── compartilhado ────────────────────────────────────── */
  const [busy, setBusy] = useState(false);
  const [addRoleLoading, setAddRoleLoading] = useState(false);
  const navigate = useNavigate();
  const { session, roles: userRoles, loading, refreshRoles, enterDemoMode } = useAuth();

  // Role esperado para esta tela de login (inferido do finalPath)
  const expectedRole = finalPath.startsWith("/lojista")
    ? "lojista"
    : finalPath.startsWith("/entregador")
      ? "entregador"
      : "cliente";

  const roleLabel =
    expectedRole === "lojista" ? "Lojista" :
    expectedRole === "entregador" ? "Entregador" :
    "Cliente";

  // Quando o usuário está autenticado:
  // → Já tem o perfil esperado → entra direto na aplicação (sem banner)
  // → Não tem o perfil esperado → mostra formulário de adição de perfil
  useEffect(() => {
    if (loading || !session) return;
    if (!userRoles.includes(expectedRole as import("@/hooks/useAuth").UserRole)) {
      setView("addRole");
      return;
    }
    // Lojista: verifica se já tem loja configurada para redirecionar corretamente.
    // Sem essa verificação, o redirect ia sempre para finalPath ("/lojista/criar-loja")
    // mesmo quando a loja já existia — causando o loop de "atualizar loja" a cada login.
    if (expectedRole === "lojista") {
      supabase.from("profiles")
        .select("extras")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          const ext = (data?.extras as Record<string, string>) ?? {};
          window.location.replace(ext.storeName ? "/lojista/painel" : finalPath);
        });
    } else {
      window.location.replace(finalPath);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, userRoles, expectedRole]);

  // Pré-carrega dados existentes do perfil quando o formulário addRole é exibido,
  // evitando que o usuário precise re-informar dados já cadastrados.
  // Os campos carregados são registrados em `preloadedFieldNames` — um conjunto
  // congelado que NÃO muda enquanto o usuário digita, evitando saltos de layout.
  useEffect(() => {
    if (view !== "addRole" || !session?.user?.id) return;
    let cancelled = false;
    setAddRoleLoading(true);

    (async () => {
      const userId = session.user.id;
      const updates: Record<string, string> = {};
      const loadedNames: string[] = [];

      // 1) Busca extras do perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("extras")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled) {
        const ext = (profile?.extras as Record<string, string>) ?? {};
        fields.forEach((f) => {
          if (ext[f.name]) {
            updates[f.name] = ext[f.name];
            loadedNames.push(f.name);
          }
        });
      }

      // 2) Para clientes: completa com endereço padrão da tabela addresses
      if (!cancelled && expectedRole === "cliente") {
        const { data: addr } = await supabase
          .from("addresses")
          .select("street, city, complement")
          .eq("user_id", userId)
          .eq("is_default", true)
          .maybeSingle();
        if (addr) {
          if (!updates.address && addr.street)     { updates.address   = addr.street;     loadedNames.push("address"); }
          if (!updates.city    && addr.city)        { updates.city      = addr.city;        loadedNames.push("city"); }
          if (!updates.reference && addr.complement){ updates.reference = addr.complement;  loadedNames.push("reference"); }
        }
      }

      if (!cancelled) {
        if (Object.keys(updates).length > 0) {
          setValues((cur) => ({ ...cur, ...updates }));
        }
        // Congela o conjunto de campos pré-carregados — não muda mais enquanto o usuário digita
        setPreloadedFieldNames(new Set(loadedNames));
        setAddRoleLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, session?.user?.id]);

  const role = expectedRole;

  /* ── helpers signup ───────────────────────────────────── */
  const updateValue = (name: string, value: string) =>
    setValues((cur) => ({ ...cur, [name]: value.slice(0, 200) }));

  const verifyCnpj = () => {
    const raw = values.cnpj;
    if (onlyDigits(raw).length !== 14) {
      toast.error("CNPJ precisa ter 14 dígitos.");
      return;
    }
    if (!isValidCnpj(raw)) {
      toast.error("CNPJ inválido. Verifique os dígitos e tente novamente.");
      return;
    }
    setCnpjVerified(true);
    toast.success("CNPJ válido! Sua loja receberá o selo verificado.");
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
          const { data: p } = await supabase.from("profiles").select("role, roles, extras").eq("id", userId).maybeSingle();
          const primaryRole = (p?.role as string | null) ?? null;
          const rolesArr = ((p?.roles as string[]) ?? []).filter(Boolean);
          const allRoles = primaryRole && !rolesArr.includes(primaryRole) ? [primaryRole, ...rolesArr] : rolesArr;
          if (allRoles.includes(expectedRole)) {
            const ext = (p?.extras as Record<string, string>) ?? {};
            const destination = expectedRole === "lojista" && ext.storeName
              ? "/lojista/painel"
              : finalPath;
            window.location.replace(destination);
          } else {
            // Usuário existe mas não tem o perfil esperado → adicionar perfil
            setView("addRole");
          }
        } else {
          window.location.replace(finalPath);
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

        // Para clientes: salva o endereço preenchido no cadastro na tabela addresses
        if (role === "cliente" && (values.address || values.city)) {
          await supabase.from("addresses").insert({
            user_id: signUpResult.session.user.id,
            label: "Casa",
            street: values.address || "",
            number: "",
            neighborhood: "",
            city: values.city || "",
            state: "",
            zip_code: "",
            complement: values.reference || "",
            is_default: true,
          });
        }

        toast.success("Conta criada! Entrando...");
        window.location.replace(finalPath);
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

    // ── Modo demonstração: interceptar ANTES de qualquer validação ──────────
    if (
      loginEmail.trim().toLowerCase() === "prototipo@gmail.com" &&
      loginPassword === "10"
    ) {
      enterDemoMode();
      toast.success("Modo demonstração ativado! Explore a plataforma.");
      navigate("/lojista/painel", { replace: true });
      return;
    }

    // Validação explícita antes de qualquer chamada ao Supabase
    if (!loginEmail.trim()) {
      setLoginError("Informe seu e-mail para continuar.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Informe sua senha para continuar.");
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

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
        const { data: p } = await supabase.from("profiles").select("role, roles, extras").eq("id", userId).maybeSingle();
        const primaryRole = (p?.role as string | null) ?? null;
        const rolesArr = ((p?.roles as string[]) ?? []).filter(Boolean);
        // Inclui role primário (contas antigas sem coluna roles populada)
        const allRoles = primaryRole && !rolesArr.includes(primaryRole) ? [primaryRole, ...rolesArr] : rolesArr;
        if (allRoles.includes(expectedRole)) {
          // Lojista com loja já configurada vai direto ao painel; caso contrário, cria loja.
          // Usa window.location.replace (não navigate) para evitar race condition:
          // navigate() é client-side e RequireRole pode ver roles=[] antes do fetchRoles
          // terminar, redirecionando de volta ao login e caindo em finalPath incorretamente.
          const ext = (p?.extras as Record<string, string>) ?? {};
          const destination = expectedRole === "lojista" && ext.storeName
            ? "/lojista/painel"
            : finalPath;
          window.location.replace(destination);
        } else {
          // Conta encontrada, mas sem o perfil esperado → mostrar adição de perfil
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

  /* ── adição de perfil complementar (usuário já autenticado) ──────── */
  const handleAddRole = async () => {
    if (!session?.user?.id) return;
    setBusy(true);
    try {
      const userId = session.user.id;

      // Busca role primário, array de roles e extras atuais
      const { data: profile } = await supabase
        .from("profiles")
        .select("extras, role, roles")
        .eq("id", userId)
        .maybeSingle();

      // ── Extras: mescla dados novos com os existentes (nunca sobrescreve) ──
      const newExtras: Record<string, string> = {};
      fields.forEach((f) => { if (values[f.name]) newExtras[f.name] = values[f.name]; });
      const mergedExtras = { ...((profile?.extras as Record<string, string>) ?? {}), ...newExtras };

      // ── Roles: ADICIONA o novo perfil sem remover os existentes ───────────
      const currentPrimary = (profile?.role as string | null) ?? null;
      const currentArr     = ((profile?.roles as string[]) ?? []).filter(Boolean);
      // Garante que o role primário também conste no array
      const baseRoles  = currentPrimary && !currentArr.includes(currentPrimary)
        ? [currentPrimary, ...currentArr]
        : currentArr;
      const newRoles   = baseRoles.includes(expectedRole) ? baseRoles : [...baseRoles, expectedRole];
      // Role primário: mantém o existente; define como expectedRole só se ainda não havia nenhum
      const newPrimary = currentPrimary ?? expectedRole;

      // ── Salva no banco ────────────────────────────────────────────────────
      const { error: errWithRoles } = await supabase
        .from("profiles")
        .update({ roles: newRoles, role: newPrimary, extras: mergedExtras })
        .eq("id", userId);

      if (errWithRoles) {
        // Fallback: coluna roles ainda não existe na migration
        const { error: errFallback } = await supabase
          .from("profiles")
          .update({ role: newPrimary, extras: mergedExtras })
          .eq("id", userId);
        if (errFallback) throw errFallback;
      }

      // ── Para cliente: salva endereço na tabela addresses (consistente com signup) ──
      if (expectedRole === "cliente" && (values.address || values.city)) {
        const { data: existingAddr } = await supabase
          .from("addresses")
          .select("id")
          .eq("user_id", userId)
          .eq("is_default", true)
          .maybeSingle();

        if (!existingAddr) {
          await supabase.from("addresses").insert({
            user_id: userId,
            label: "Casa",
            street: values.address || "",
            number: "",
            neighborhood: "",
            city: values.city || "",
            state: "",
            zip_code: "",
            complement: values.reference || "",
            is_default: true,
          });
        }
      }

      // ── Lojista com CNPJ verificado ───────────────────────────────────────
      const cnpjDigits = onlyDigits(values.cnpj);
      if (expectedRole === "lojista" && cnpjDigits && cnpjVerified) {
        await supabase.from("profiles").update({ cnpj: cnpjDigits, verified: true }).eq("id", userId);
      }

      toast.success(`Perfil de ${roleLabel} ativado com sucesso!`);

      // Usa window.location em vez de navigate() para evitar race condition:
      // refreshRoles() atualiza o estado do React de forma assíncrona, mas navigate()
      // pode disparar ANTES do re-render com os novos roles, fazendo RequireRole
      // redirecionar de volta ao login. A recarga completa garante que o ciclo de
      // autenticação re-inicia já com os roles atualizados no banco.
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

  /* ── renderizador de campo genérico ──────────────────────
     Suporta input de texto simples OU seletor de chips com "Outro".
  ────────────────────────────────────────────────────────── */
  const renderField = (field: Field, prefilled = false) => {
    if (!field.options?.length) {
      // Campo de texto simples
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

    // Campo com opções (chips selecionáveis + "Outro")
    const currentValue  = values[field.name] || "";
    const inList        = field.options.includes(currentValue);
    const isOther       = otherSelected[field.name] || (!inList && currentValue !== "");

    const selectOption = (opt: string) => {
      setOtherSelected((prev) => ({ ...prev, [field.name]: false }));
      updateValue(field.name, opt);
    };

    const selectOther = () => {
      setOtherSelected((prev) => ({ ...prev, [field.name]: true }));
      if (inList) updateValue(field.name, ""); // limpa opção prévia se vinha de preset
    };

    return (
      <div key={field.name} className="bg-card border border-border rounded-xl px-4 py-3 shadow-card space-y-3">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          {prefilled && <CheckCircle2 className="w-3 h-3 text-primary" />}
          {field.label}
        </span>

        {/* Grid de chips rolável */}
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

          {/* Opção "Outro" */}
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

        {/* Input livre quando "Outro" está selecionado */}
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

        {/* Indicador do valor selecionado (quando um preset está ativo) */}
        {inList && (
          <p className="text-xs text-primary font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {currentValue}
          </p>
        )}
      </div>
    );
  };

  /* ── variáveis de renderização do signup ──────────────── */
  const progress = ((step + 1) / 4) * 100;
  const showNameEmail = step === 2 && signupMode === "signup";
  const isFinal = step === 3;
  const isSellerSignupFinal = isFinal && signupMode === "signup" && role === "lojista";

  /* ══════════════════════════════════════════════════════
     VISTA: ADICIONAR PERFIL (usuário já logado, sem o perfil esperado)
  ══════════════════════════════════════════════════════ */
  if (view === "addRole") {
    // Divisão congelada: baseada no que veio do banco, NÃO no valor atual.
    // Isso impede que o campo "salte" de seção enquanto o usuário digita.
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

          {/* Header */}
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

          {/* Skeleton enquanto pré-carrega dados do perfil */}
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
              {/* Campos pré-preenchidos (dados já existentes) */}
              {prefilledFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
                    Dados já cadastrados
                  </p>
                  {prefilledFields.map((field) => renderField(field, true))}
                </div>
              )}

              {/* Campos vazios (informações exclusivas necessárias) */}
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

              {/* CNPJ para lojista */}
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
              fields.map((field) => renderField(field, false))}

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
