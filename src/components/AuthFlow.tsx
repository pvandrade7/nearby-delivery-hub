import { useEffect, useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
};

const defaultValues: Record<string, string> = {
  phone: "",
  code: "",
  name: "",
  email: "",
  password: "",
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const AuthFlow = ({
  title,
  subtitle,
  icon: Icon,
  finalPath,
  profileTitle,
  detailsTitle,
  detailsSubtitle,
  fields,
}: AuthFlowProps) => {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) navigate(finalPath, { replace: true });
  }, [loading, session, navigate, finalPath]);

  const role = finalPath.startsWith("/lojista")
    ? "lojista"
    : finalPath.startsWith("/entregador")
      ? "entregador"
      : "cliente";

  const updateValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value.slice(0, 160) }));
  };

  const checkPhoneExists = async (phone: string) => {
    const { data } = await supabase.from("profiles").select("id").eq("phone", phone).maybeSingle();
    return !!data;
  };

  const goNext = async () => {
    if (busy) return;

    // Step 0: phone — detect if account exists to switch to login
    if (step === 0) {
      const phone = onlyDigits(values.phone);
      if (phone.length < 10) {
        toast.error("Informe um telefone válido");
        return;
      }
      setBusy(true);
      try {
        const exists = await checkPhoneExists(phone);
        setMode(exists ? "login" : "signup");
        // Skip SMS step (3rd party not configured); jump straight to next
        setStep(exists ? 3 : 1);
      } finally {
        setBusy(false);
      }
      return;
    }

    // Step 1: SMS — disabled, treat as confirmation pass-through
    if (step === 1) {
      setStep(2);
      return;
    }

    // Step 2: name + email (signup only)
    if (step === 2) {
      if (!values.name || !values.email) {
        toast.error("Preencha nome e email");
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: details + password — submit
    if (!values.password || values.password.length < 6) {
      toast.error("Senha precisa de pelo menos 6 caracteres");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        // Login by phone: resolve email via edge function, then signIn
        const phone = onlyDigits(values.phone);
        const { data, error } = await supabase.functions.invoke("resolve-login", {
          body: { identifier: phone },
        });
        if (error || !data?.email) throw new Error("Conta não encontrada");
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: values.password,
        });
        if (signErr) throw signErr;
        toast.success("Bem-vindo!");
      } else {
        const phone = onlyDigits(values.phone);
        const extras: Record<string, string> = {};
        fields.forEach((f) => {
          if (values[f.name]) extras[f.name] = values[f.name];
        });
        const { error: signErr } = await supabase.auth.signUp({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}${finalPath}`,
            data: {
              display_name: values.name,
              phone,
              role,
              extras,
            },
          },
        });
        if (signErr) throw signErr;
        toast.success("Conta criada!");
      }
      navigate(finalPath, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  };

  const progress = ((step + 1) / 4) * 100;
  const showNameEmail = step === 2 && mode === "signup";
  const isFinal = step === 3;

  return (
    <div className="px-6 py-10 max-w-md mx-auto">
      <Link to="/" className="size-10 rounded-full bg-muted flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="mt-8">
        <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
          <div className="h-full gradient-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
        <h1 className="text-2xl font-extrabold">
          {step === 0 && title}
          {step === 1 && "Confirme seu número"}
          {step === 2 && profileTitle}
          {step === 3 && (mode === "login" ? "Entrar na sua conta" : detailsTitle)}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 0 && subtitle}
          {step === 1 && `Digite o código enviado por SMS para ${values.phone || "seu número"}.`}
          {step === 2 && "Complete seus dados para personalizar sua experiência."}
          {step === 3 && (mode === "login" ? "Informe sua senha para continuar." : detailsSubtitle)}
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
            {mode === "signup" &&
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
            <label className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
              <Lock className="w-5 h-5 text-primary" />
              <input
                value={values.password}
                onChange={(e) => updateValue("password", e.target.value)}
                placeholder="Sua senha"
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
          {busy ? "..." : isFinal ? (mode === "login" ? "Entrar" : "Criar conta") : "Continuar"}
          {isFinal && !busy && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-12">
        Ao continuar você concorda com nossos termos de uso e política de privacidade.
      </p>
    </div>
  );
};
