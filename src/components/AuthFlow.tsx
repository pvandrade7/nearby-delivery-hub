import { useEffect, useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImagePicker } from "@/components/ImagePicker";
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
  allowSkip?: boolean; // cliente pode "entrar depois"
  skipPath?: string;
};

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
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [busy, setBusy] = useState(false);
  const [cnpjVerified, setCnpjVerified] = useState(false);
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
    setValues((current) => ({ ...current, [name]: value.slice(0, 200) }));
  };

  const checkPhoneExists = async (phone: string) => {
    const { data } = await supabase.from("profiles").select("id").eq("phone", phone).maybeSingle();
    return !!data;
  };

  const verifyCnpj = async () => {
    const digits = onlyDigits(values.cnpj);
    if (digits.length !== 14) {
      toast.error("CNPJ precisa ter 14 dígitos");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-cnpj", {
        body: { cnpj: digits },
      });
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
      if (phone.length < 10) {
        toast.error("Informe um telefone válido");
        return;
      }
      setBusy(true);
      try {
        const exists = await checkPhoneExists(phone);
        setMode(exists ? "login" : "signup");
        setStep(exists ? 3 : 1);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!values.name || !values.email) {
        toast.error("Preencha nome e email");
        return;
      }
      setStep(3);
      return;
    }

    if (!values.password || values.password.length < 6) {
      toast.error("Senha precisa de pelo menos 6 caracteres");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
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
        if (values.avatar) extras.avatar_url = values.avatar;
        const cnpjDigits = onlyDigits(values.cnpj);
        const { error: signErr } = await supabase.auth.signUp({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}${finalPath}`,
            data: {
              display_name: values.name,
              phone,
              role,
              avatar_url: values.avatar || undefined,
              extras,
            },
          },
        });
        if (signErr) throw signErr;

        // Persist CNPJ + verified flag after signup if applicable
        if (role === "lojista" && cnpjDigits && cnpjVerified) {
          const { data: sess } = await supabase.auth.getSession();
          if (sess.session) {
            await supabase
              .from("profiles")
              .update({ cnpj: cnpjDigits, verified: true })
              .eq("id", sess.session.user.id);
          }
        }
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
  const isSellerSignupFinal = isFinal && mode === "signup" && role === "lojista";

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

            {isSellerSignupFinal && (
              <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-card space-y-2">
                <span className="text-xs font-bold text-muted-foreground">CNPJ (selo verificado)</span>
                <div className="flex gap-2">
                  <input
                    value={values.cnpj}
                    onChange={(e) => {
                      setCnpjVerified(false);
                      updateValue("cnpj", e.target.value);
                    }}
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
                <Link
                  to="/cliente/chat/suporte-verificacao"
                  className="block text-xs text-muted-foreground underline pt-1"
                >
                  Não tenho CNPJ — falar com administrador
                </Link>
              </div>
            )}

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

        {allowSkip && step === 0 && skipPath && (
          <Link
            to={skipPath}
            className="block text-center text-sm font-semibold text-muted-foreground py-2 hover:text-foreground"
          >
            Fazer login depois
          </Link>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-12">
        Ao continuar você concorda com nossos termos de uso e política de privacidade.
      </p>
    </div>
  );
};
