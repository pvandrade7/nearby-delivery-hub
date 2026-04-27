import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Phone, ShoppingBag } from "lucide-react";

const ClientLogin = () => {
  const [step, setStep] = useState<"phone" | "sms">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const continueFlow = () => {
    if (step === "phone") setStep("sms");
    else navigate("/cliente/home");
  };

  return (
    <div className="px-6 py-10 max-w-md mx-auto">
      <Link to="/" className="size-10 rounded-full bg-muted flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="mt-8">
        <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-5">
          <ShoppingBag className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold">
          {step === "phone" ? "Entrar como Cliente" : "Confirme seu número"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "phone" ? "Entre para comprar nas lojas locais da sua cidade." : `Digite o código enviado por SMS para ${phone || "seu número"}.`}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {step === "phone" ? (
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Phone className="w-5 h-5 text-primary" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 9 9999-0000"
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
            <Lock className="w-5 h-5 text-primary" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="flex-1 bg-transparent text-lg font-bold tracking-[0.5em] text-center focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={continueFlow}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
        >
          {step === "phone" ? "Receber código por SMS" : "Confirmar"}
        </button>

        <button onClick={() => navigate("/cliente/home")} className="w-full text-sm text-primary font-bold">
          Pular login e entrar no protótipo
        </button>
      </div>
    </div>
  );
};

export default ClientLogin;