import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck, FileVideo, Globe2, History,
  ShieldCheck, Clock, CheckCircle2, XCircle, LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { toast } from "sonner";

type VerificationStatus = "verified" | "in_review" | "pending" | "rejected";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** Valida CNPJ pelo algoritmo oficial da Receita Federal (dígitos verificadores). */
const isValidCnpj = (raw: string): boolean => {
  const d = onlyDigits(raw);
  if (d.length !== 14) return false;
  if (/^(\d)\1+$/.test(d)) return false; // todos iguais (ex: 00000000000000)

  const calc = (len: number) => {
    let sum = 0;
    let w = len - 7;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * w--;
      if (w < 2) w = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
};

/* ── Tela: conta verificada ────────────────────────────── */
const VerifiedScreen = ({ storeName }: { storeName?: string }) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-6">
      <div className="size-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-12 h-12 text-success" />
      </div>
      <div className="mb-4">
        <VerifiedBadge className="text-base px-4 py-1.5" />
      </div>
      <h1 className="text-2xl font-extrabold mt-4">Conta Verificada</h1>
      {storeName && (
        <p className="text-muted-foreground text-sm mt-1 font-semibold">{storeName}</p>
      )}
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-sm mx-auto">
        Sua loja foi aprovada e possui o selo de verificado na plataforma Vendy+.
        Compradores podem identificar sua loja como confiável.
      </p>
      <div className="mt-8 bg-success/10 border border-success/20 rounded-2xl p-5 text-left space-y-2">
        {[
          "Loja exibida com selo verificado",
          "Maior confiança dos compradores",
          "Prioridade nos resultados de busca",
          "Acesso a funcionalidades exclusivas",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {item}
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate("/lojista/painel")}
        className="mt-8 w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2"
      >
        <LayoutDashboard className="w-4 h-4" /> Ir ao painel
      </button>
    </div>
  );
};

/* ── Tela: em análise ──────────────────────────────────── */
const InReviewScreen = ({ hasCnpj }: { hasCnpj: boolean }) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-6">
      <div className="size-24 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
        <Clock className="w-12 h-12 text-warning" />
      </div>
      <span className="inline-flex items-center gap-1.5 bg-warning/10 text-warning rounded-full px-3 py-1 text-xs font-bold border border-warning/20">
        <Clock className="w-3 h-3" /> Em análise
      </span>
      <h1 className="text-2xl font-extrabold mt-4">Solicitação em análise</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-sm mx-auto">
        {hasCnpj
          ? "Seu CNPJ foi enviado e está sendo validado pela equipe Vendy+."
          : "Sua solicitação de verificação manual foi recebida e está sendo analisada."}
        {" "}O prazo estimado é de <strong>2 a 5 dias úteis</strong>.
      </p>
      <div className="mt-8 bg-muted rounded-2xl p-5 text-left space-y-4">
        {[
          { label: "Solicitação enviada", done: true },
          { label: "Em análise pela equipe", done: false },
          { label: "Aprovação do selo verificado", done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
              step.done ? "bg-success text-white" : "bg-border text-muted-foreground"
            }`}>
              {step.done
                ? <CheckCircle2 className="w-4 h-4" />
                : <span className="text-xs font-bold">{i + 1}</span>}
            </div>
            <p className={`text-sm font-semibold ${step.done ? "text-success" : "text-muted-foreground"}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Você será notificado assim que sua verificação for concluída.
      </p>
      <button
        onClick={() => navigate("/lojista/painel")}
        className="mt-6 w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2"
      >
        <LayoutDashboard className="w-4 h-4" /> Ir ao painel
      </button>
    </div>
  );
};

/* ── Tela: rejeitado ───────────────────────────────────── */
const RejectedScreen = ({ reason, onRetry }: { reason?: string; onRetry: () => void }) => (
  <div className="max-w-lg mx-auto text-center py-16 px-6">
    <div className="size-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
      <XCircle className="w-12 h-12 text-destructive" />
    </div>
    <span className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-full px-3 py-1 text-xs font-bold border border-destructive/20">
      Verificação não aprovada
    </span>
    <h1 className="text-2xl font-extrabold mt-4">Verificação Rejeitada</h1>
    {reason && (
      <div className="mt-4 bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-sm text-left text-destructive">
        <p className="font-bold mb-1">Motivo:</p>
        <p>{reason}</p>
      </div>
    )}
    <p className="text-muted-foreground mt-3 text-sm">
      Você pode corrigir as informações e solicitar uma nova verificação.
    </p>
    <button
      onClick={onRetry}
      className="mt-8 w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card"
    >
      Solicitar nova verificação
    </button>
  </div>
);

/* ── Tela principal: formulário de verificação ─────────── */
const VerificationForm = ({
  onCnpjSubmit,
  onManualRequest,
  busy,
}: {
  onCnpjSubmit: (cnpj: string) => Promise<void>;
  onManualRequest: () => Promise<void>;
  busy: boolean;
}) => {
  const [cnpj, setCnpj] = useState("");
  const cnpjValid = isValidCnpj(cnpj);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Verificação por CNPJ */}
      <section className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
        <div className="size-11 rounded-xl bg-success/15 text-success flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg">Verificação automática por CNPJ</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lojas com CNPJ válido são verificadas após validação com a Receita Federal.
          </p>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CNPJ</label>
          <input
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            maxLength={18}
            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => onCnpjSubmit(cnpj)}
          disabled={!cnpjValid || busy}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3 font-bold shadow-card disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? "Validando..." : "Validar CNPJ"}
          {!busy && cnpjValid && <CheckCircle2 className="w-4 h-4" />}
        </button>
        <p className="text-xs text-muted-foreground text-center">
          O CNPJ deve ter 14 dígitos e estar ativo na Receita Federal.
        </p>
      </section>

      {/* Verificação manual */}
      <section className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
        <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <BadgeCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg">Verificação manual</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Empreendedores sem CNPJ podem solicitar análise administrativa com evidências do negócio.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: FileVideo, label: "Vídeos do estoque" },
            { icon: History,   label: "Histórico de vendas" },
            { icon: Globe2,    label: "Redes comerciais" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-left"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <p className="text-xs font-bold mt-3">{item.label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onManualRequest}
          disabled={busy}
          className="w-full border-2 border-primary text-primary rounded-xl py-3 font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
        >
          {busy ? "Enviando..." : "Solicitar verificação manual"}
        </button>
      </section>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Componente principal
══════════════════════════════════════════════════════════ */
const SellerVerification = () => {
  const { user } = useAuth();
  const [status, setStatus]     = useState<VerificationStatus>("pending");
  const [hasCnpj, setHasCnpj]   = useState(false);
  const [storeName, setStoreName] = useState<string | undefined>();
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);

  // ── Carrega status real do banco ────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("verified, cnpj, extras")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error("[SellerVerification]", error); setLoading(false); return; }

        const ext = (data?.extras as Record<string, string>) ?? {};
        const sName = ext.storeName || undefined;
        setStoreName(sName);

        if (data?.verified) {
          setStatus("verified");
        } else if (ext.verificationRejected) {
          setStatus("rejected");
          setRejectionReason(ext.rejectionReason || undefined);
        } else if (data?.cnpj || ext.manualRequested) {
          setStatus("in_review");
          setHasCnpj(!!data?.cnpj);
        } else {
          setStatus("pending");
        }
        setLoading(false);
      });
  }, [user]);

  // ── Submissão de CNPJ ───────────────────────────────────
  const handleCnpjSubmit = async (cnpj: string) => {
    if (!user) return;
    const digits = onlyDigits(cnpj);

    // Validação local pelo algoritmo da Receita Federal (dígitos verificadores)
    if (!isValidCnpj(cnpj)) {
      toast.error("CNPJ inválido. Verifique os números e tente novamente.");
      return;
    }

    setBusy(true);
    try {
      // CNPJ válido → verificação imediata (sem necessidade de análise manual)
      const { error } = await supabase
        .from("profiles")
        .update({ cnpj: digits, verified: true })
        .eq("id", user.id);
      if (error) throw error;

      toast.success("CNPJ válido! Sua loja foi verificada e o selo foi ativado.");
      setStatus("verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar CNPJ. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  // ── Solicitação de verificação manual ──────────────────
  const handleManualRequest = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("extras")
        .eq("id", user.id)
        .maybeSingle();

      const extras = {
        ...((profile?.extras as Record<string, string>) ?? {}),
        manualRequested: "true",
        manualRequestDate: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update({ extras })
        .eq("id", user.id);
      if (error) throw error;

      toast.success("Solicitação enviada! Nossa equipe analisará em até 5 dias úteis.");
      setStatus("in_review");
      setHasCnpj(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar solicitação.");
    } finally {
      setBusy(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto">
        <div className="space-y-3 max-w-lg mx-auto py-16">
          <div className="size-24 rounded-full bg-muted animate-pulse mx-auto" />
          <div className="h-6 w-40 bg-muted rounded mx-auto animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Telas por status ────────────────────────────────────
  if (status === "verified") return <VerifiedScreen storeName={storeName} />;
  if (status === "in_review") return <InReviewScreen hasCnpj={hasCnpj} />;
  if (status === "rejected") return (
    <RejectedScreen
      reason={rejectionReason}
      onRetry={() => setStatus("pending")}
    />
  );

  // ── Status "pending": formulário de verificação ─────────
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conta da loja</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Verificação do vendedor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique sua loja para ganhar o selo de confiança e aumentar suas vendas.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground w-fit border border-border">
          Status: Não verificado
        </span>
      </div>

      <VerificationForm
        onCnpjSubmit={handleCnpjSubmit}
        onManualRequest={handleManualRequest}
        busy={busy}
      />
    </div>
  );
};

export default SellerVerification;
