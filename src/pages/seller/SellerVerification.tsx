import { useMemo, useState } from "react";
import { BadgeCheck, FileVideo, Globe2, History, ShieldCheck } from "lucide-react";
import { stores } from "@/data/mockData";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const isValidCnpj = (value: string) => value.replace(/\D/g, "").length === 14;

const SellerVerification = () => {
  const store = stores.find((item) => item.id === "s3")!;
  const [cnpj, setCnpj] = useState("");
  const [manualRequested, setManualRequested] = useState(store.verificationStatus === "pendente");
  const cnpjValid = useMemo(() => isValidCnpj(cnpj), [cnpj]);
  const isVerified = store.verificationStatus === "verificado" || cnpjValid;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conta da loja</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-1 flex flex-wrap items-center gap-2">
            Verificação do vendedor {isVerified && <VerifiedBadge />}
          </h1>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground w-fit">
          Status: {isVerified ? "verificado" : manualRequested ? "pendente" : "não verificado"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
          <div className="size-11 rounded-xl bg-success/15 text-success flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">Verificação automática por CNPJ</h2>
            <p className="text-sm text-muted-foreground mt-1">Lojas com CNPJ válido recebem o selo automaticamente.</p>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CNPJ</label>
            <input
              value={cnpj}
              onChange={(event) => setCnpj(event.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button className="w-full gradient-brand text-primary-foreground rounded-xl py-3 font-bold shadow-card disabled:opacity-60" disabled={!cnpjValid}>
            {cnpjValid ? "CNPJ válido — selo liberado" : "Validar CNPJ"}
          </button>
        </section>

        <section className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">Verificação manual</h2>
            <p className="text-sm text-muted-foreground mt-1">Empreendedores sem CNPJ podem enviar evidências para análise administrativa.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: FileVideo, label: "Vídeos do estoque" },
              { icon: History, label: "Histórico de vendas" },
              { icon: Globe2, label: "Redes comerciais" },
            ].map((item) => (
              <button key={item.label} className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-left hover:border-primary transition-colors">
                <item.icon className="w-5 h-5 text-primary" />
                <p className="text-xs font-bold mt-3">{item.label}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setManualRequested(true)}
            className="w-full border-2 border-primary text-primary rounded-xl py-3 font-bold hover:bg-primary/5 transition-colors"
          >
            {manualRequested ? "Solicitação enviada para análise" : "Solicitar verificação manual"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default SellerVerification;
