import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Phone, Lock, ArrowLeft } from "lucide-react";

const SellerLogin = () => {
  const [step, setStep] = useState<"phone" | "sms">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col px-6 py-6">
      <Link to="/" className="size-10 rounded-full bg-muted flex items-center justify-center self-start">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="mt-8">
        <div className="size-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center mb-5">
          <Store className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold">
          {step === "phone" ? "Entrar como Lojista" : "Confirme seu número"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "phone" ? "Use seu celular para entrar ou criar sua loja." : `Digite o código enviado por SMS para ${phone || "seu número"}.`}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {step === "phone" ? (
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 9 9999-0000"
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </div>
        ) : (
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-3">
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
          onClick={() => {
            if (step === "phone") setStep("sms");
            else navigate("/lojista/criar-loja");
          }}
          className="w-full gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated"
        >
          {step === "phone" ? "Receber código por SMS" : "Confirmar"}
        </button>

        {step === "sms" && (
          <button onClick={() => setStep("phone")} className="w-full text-sm text-muted-foreground font-semibold">
            Reenviar código
          </button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-auto">
        Ao continuar você concorda com nossos termos de uso.
      </p>
    </div>
  );
};

export default SellerLogin;
