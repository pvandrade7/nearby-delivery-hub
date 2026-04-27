import { useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";

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

const defaultValues = { phone: "", code: "", name: "", email: "" };

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
  const navigate = useNavigate();

  const goNext = () => {
    if (step >= 3) navigate(finalPath);
    else setStep((current) => current + 1);
  };

  const updateValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value.slice(0, 120) }));
  };

  const progress = ((step + 1) / 4) * 100;

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
          {step === 3 && detailsTitle}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 0 && subtitle}
          {step === 1 && `Digite o código enviado por SMS para ${values.phone || "seu número"}.`}
          {step === 2 && "Complete seus dados para personalizar sua experiência."}
          {step === 3 && detailsSubtitle}
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

        {step === 2 && (
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

        {step === 3 && (
          <div className="space-y-3">
            {fields.map((field) => (
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
          </div>
        )}

        <button
          onClick={goNext}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2"
        >
          {step === 3 ? "Entrar" : "Continuar"}
          {step === 3 && <CheckCircle2 className="w-4 h-4" />}
        </button>

        <button onClick={goNext} className="w-full text-sm text-primary font-bold">
          Agora não
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-12">
        Ao continuar você concorda com nossos termos de uso e política de privacidade.
      </p>
    </div>
  );
};