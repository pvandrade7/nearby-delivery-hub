import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BadgeCheck, CheckCircle2, XCircle, Clock, LayoutDashboard,
  ShieldCheck, AtSign, Globe2, Phone, Upload,
  Trash2, Image as ImageIcon, FileText, ChevronLeft, ArrowLeft,
  Lock, RefreshCw, CalendarCheck, Hash, Store,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";
import { manualVerificationSchema, firstError } from "@/schemas";
import { toast } from "sonner";

// ── tipos ────────────────────────────────────────────────
type VerifStatus = "verified" | "in_review" | "rejected" | "pending";

type VerifRecord = {
  id: string;
  status: string;
  rejection_reason: string | null;
  submitted_at: string;
};

type UploadedFile = {
  url: string;
  type: "store_photo" | "product_photo" | "document";
  name: string;
};

export type ManualFormData = {
  store_name: string;
  store_description: string;
  store_category: string;
  business_duration: string;
  city: string;
  neighborhood: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
  website: string;
  observations: string;
  no_cnpj_reason: string;
};

const EMPTY_FORM: ManualFormData = {
  store_name: "", store_description: "", store_category: "",
  business_duration: "", city: "", neighborhood: "",
  instagram: "", facebook: "", tiktok: "", whatsapp: "",
  website: "", observations: "", no_cnpj_reason: "",
};

// Usa a lista canônica de categorias do sistema (mesma do cadastro e CreateStore)
const CATEGORIES = [...SELLER_CATEGORIES];
const DURATIONS = ["Menos de 1 ano", "1 a 2 anos", "2 a 5 anos", "Mais de 5 anos"];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Subcomponentes FORA de ManualForm para evitar re-mount
// a cada keystroke (causa raiz da perda de foco)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TextField = ({
  label, value, onChange, placeholder, type = "text", multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  multiline?: boolean;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    )}
  </label>
);

const ChipSelect = ({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            value === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const SocialField = ({
  label, icon: Icon, value, onChange, placeholder, type = "text",
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </label>
);

// ── upload múltiplo ──────────────────────────────────────
const MultiUpload = ({
  label, type, files, onAdd, onRemove, accept, busy,
}: {
  label: string;
  type: UploadedFile["type"];
  files: UploadedFile[];
  onAdd: (file: File, type: UploadedFile["type"]) => Promise<void>;
  onRemove: (url: string) => void;
  accept: string;
  busy: boolean;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const relevant = files.filter((f) => f.type === type);
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-2">
        {relevant.map((f) => (
          <div key={f.url} className="relative group">
            {/\.(jpg|jpeg|png|webp|gif)$/i.test(f.url) ? (
              <img src={f.url} alt={f.name} className="w-20 h-20 object-cover rounded-xl border border-border" />
            ) : (
              <div className="w-20 h-20 rounded-xl border border-border bg-muted flex flex-col items-center justify-center gap-1 p-1">
                <FileText className="w-6 h-6 text-muted-foreground" />
                <p className="text-[9px] text-muted-foreground font-semibold text-center leading-tight line-clamp-2">{f.name}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(f.url)}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {busy
            ? <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            : <><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground font-semibold">Adicionar</span></>}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => onAdd(f, type)); e.target.value = ""; }}
      />
    </div>
  );
};

// ── página de status de verificação (loja já aprovada) ──
type VerifDetails = {
  storeName?: string;
  approvedAt?: string | null;
  method: "cnpj" | "manual" | "unknown";
  verifId?: string;
  isFirstAccess?: boolean; // vindo do onboarding (mostra botão "Ir ao painel")
};

const VerifiedStatusPage = ({ details }: { details: VerifDetails }) => {
  const { refreshVerified } = useAuth();
  const [going, setGoing] = useState(false);

  const handleGoToPainel = async () => {
    setGoing(true);
    window.location.replace("/lojista/painel");
  };

  const methodLabel = details.method === "cnpj"
    ? "Verificação automática por CNPJ"
    : details.method === "manual"
    ? "Verificação manual pela equipe"
    : "—";

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-2xl bg-success/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-7 h-7 text-success" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold">Verificação da loja</h1>
            <VerifiedBadge />
          </div>
          {details.storeName && (
            <p className="text-sm text-muted-foreground font-semibold">{details.storeName}</p>
          )}
        </div>
      </div>

      {/* Card de status */}
      <div className="bg-success/5 border border-success/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-success" />
          <p className="font-extrabold text-success">Loja verificada com sucesso</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sua loja foi aprovada pela equipe Vendy+ e possui o selo de loja verificada.
          Compradores podem identificar sua loja como confiável.
        </p>

        {/* Detalhes da aprovação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {details.approvedAt && (
            <div className="bg-card rounded-xl p-3 flex items-start gap-2.5">
              <CalendarCheck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Data de aprovação</p>
                <p className="text-sm font-semibold mt-0.5">
                  {new Date(details.approvedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}
          {details.storeName && (
            <div className="bg-card rounded-xl p-3 flex items-start gap-2.5">
              <Store className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Loja verificada</p>
                <p className="text-sm font-semibold mt-0.5">{details.storeName}</p>
              </div>
            </div>
          )}
          <div className="bg-card rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Método de validação</p>
              <p className="text-sm font-semibold mt-0.5">{methodLabel}</p>
            </div>
          </div>
          {details.verifId && (
            <div className="bg-card rounded-xl p-3 flex items-start gap-2.5">
              <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">ID da solicitação</p>
                <p className="text-sm font-mono font-bold mt-0.5">{details.verifId.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefícios */}
      <div className="bg-card rounded-2xl shadow-card p-5">
        <h2 className="font-extrabold text-base mb-4">Benefícios do selo verificado</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: BadgeCheck,  label: "Selo verificado ativo",            desc: "Exibido na sua loja e nos resultados de busca" },
            { icon: CheckCircle2,label: "Maior confiança dos compradores",   desc: "Clientes identificam sua loja como confiável" },
            { icon: Store,       label: "Destaque nos resultados",           desc: "Prioridade nas buscas da plataforma" },
            { icon: ShieldCheck, label: "Funcionalidades exclusivas",        desc: "Acesso a recursos disponíveis apenas para lojas verificadas" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <div className="size-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-bold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão "Ir ao painel" — apenas no primeiro acesso (vindo do onboarding) */}
      {details.isFirstAccess && (
        <button
          onClick={handleGoToPainel}
          disabled={going}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {going
            ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Abrindo painel...</>
            : <><LayoutDashboard className="w-4 h-4" /> Ir ao painel</>}
        </button>
      )}
    </div>
  );
};

const InReviewScreen = ({
  hasCnpj, record, onRefresh, refreshing,
}: {
  hasCnpj: boolean;
  record: VerifRecord | null;
  onRefresh: () => void;
  refreshing: boolean;
}) => (
  <div className="max-w-lg mx-auto text-center py-16 px-6">
    <div className="size-24 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
      <Clock className="w-12 h-12 text-warning" />
    </div>
    <span className="inline-flex items-center gap-1.5 bg-warning/10 text-warning rounded-full px-3 py-1 text-xs font-bold border border-warning/20">
      <Clock className="w-3 h-3" /> Pendente de análise
    </span>
    <h1 className="text-2xl font-extrabold mt-4">Solicitação em análise</h1>
    <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-sm mx-auto">
      {hasCnpj ? "Seu CNPJ foi enviado e está sendo validado." : "Sua solicitação de verificação manual foi recebida."}
      {" "}O prazo estimado é de <strong>2 a 5 dias úteis</strong>.
    </p>

    {record && (
      <div className="mt-6 bg-muted rounded-2xl p-4 text-left space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground font-semibold">Número da solicitação</span>
          <span className="font-mono font-bold">{record.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-semibold">Data de envio</span>
          <span className="font-semibold">{new Date(record.submitted_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-semibold">Status</span>
          <span className="text-warning font-bold">Pendente</span>
        </div>
      </div>
    )}

    <div className="mt-6 bg-muted rounded-2xl p-5 text-left space-y-4">
      {[
        { label: "Solicitação enviada", done: true },
        { label: "Em análise pela equipe", done: false },
        { label: "Aprovação e liberação de acesso", done: false },
      ].map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-success text-white" : "bg-border text-muted-foreground"}`}>
            {step.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
          </div>
          <p className={`text-sm font-semibold ${step.done ? "text-success" : "text-muted-foreground"}`}>{step.label}</p>
        </div>
      ))}
    </div>

    {/* Botão de verificar status — útil quando o admin aprovou e o realtime não disparou */}
    <button
      onClick={onRefresh}
      disabled={refreshing}
      className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
    >
      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
      {refreshing ? "Verificando..." : "Verificar status da aprovação"}
    </button>

    <div className="mt-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
      <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="text-left">
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Acesso temporariamente restrito</p>
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 leading-relaxed">
          Assim que aprovada, sua conta será liberada automaticamente ou ao clicar em "Verificar status".
        </p>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mt-6">
      Dúvidas? Entre em contato pelo e-mail <strong>suporte@vendymais.com.br</strong>
    </p>
  </div>
);

const RejectedScreen = ({ reason, onRetry }: { reason?: string | null; onRetry: () => void }) => (
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
        <p className="font-bold mb-1">Motivo informado pelo administrador:</p>
        <p>{reason}</p>
      </div>
    )}
    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
      Corrija as informações e envie uma nova solicitação. Sua conta permanecerá restrita até a aprovação.
    </p>
    <button onClick={onRetry} className="mt-8 w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card flex items-center justify-center gap-2">
      <BadgeCheck className="w-4 h-4" /> Enviar nova solicitação
    </button>
  </div>
);

// ── validação CNPJ ────────────────────────────────────────
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const isValidCnpj = (raw: string): boolean => {
  const d = onlyDigits(raw);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0; let w = len - 7;
    for (let i = 0; i < len; i++) { sum += parseInt(d[i]) * w--; if (w < 2) w = 9; }
    const r = sum % 11; return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
};

const CnpjForm = ({ onSubmit, busy }: { onSubmit: (cnpj: string) => Promise<void>; busy: boolean }) => {
  const [cnpj, setCnpj] = useState("");
  const valid = isValidCnpj(cnpj);
  return (
    <section className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
      <div className="size-11 rounded-xl bg-success/15 text-success flex items-center justify-center">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div>
        <h2 className="font-extrabold text-lg">Verificação automática por CNPJ</h2>
        <p className="text-sm text-muted-foreground mt-1">Lojas com CNPJ válido são verificadas e liberadas imediatamente.</p>
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CNPJ</label>
        <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18}
          className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <button onClick={() => onSubmit(cnpj)} disabled={!valid || busy}
        className="w-full gradient-brand text-primary-foreground rounded-xl py-3 font-bold shadow-card disabled:opacity-60 flex items-center justify-center gap-2">
        {busy ? "Validando..." : "Validar CNPJ e liberar acesso"}
        {!busy && valid && <CheckCircle2 className="w-4 h-4" />}
      </button>
      <p className="text-xs text-muted-foreground text-center">O CNPJ deve ter 14 dígitos e estar ativo na Receita Federal.</p>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ManualForm — usa TextField/ChipSelect definidos FORA
// para evitar re-mount a cada keystroke
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ManualForm = ({
  initialData,
  onSubmit,
  onBack,
  busy,
}: {
  initialData: Partial<ManualFormData>;
  onSubmit: (data: ManualFormData, files: UploadedFile[]) => Promise<void>;
  onBack: () => void;
  busy: boolean;
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<ManualFormData>(() => ({ ...EMPTY_FORM, ...initialData }));
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  // Sincroniza initialData quando muda (por ex. após fetch de perfil completar)
  useEffect(() => {
    setData((prev) => {
      const merged = { ...prev };
      (Object.keys(initialData) as (keyof ManualFormData)[]).forEach((k) => {
        const v = initialData[k];
        // Só preenche se o campo ainda está vazio (não sobrescreve o que o usuário digitou)
        if (v && !prev[k]) merged[k] = v;
      });
      return merged;
    });
  }, [initialData]);

  const set = (k: keyof ManualFormData, v: string) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const handleUpload = async (file: File, type: UploadedFile["type"]) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 10 MB."); return; }
    setUploadBusy(true);
    try {
      const ext  = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${type}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("verification-files").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("verification-files").getPublicUrl(path);
      setFiles((fs) => [...fs, { url: pub.publicUrl, type, name: file.name }]);
      toast.success("Arquivo enviado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploadBusy(false);
    }
  };

  const removeFile = (url: string) => setFiles((fs) => fs.filter((f) => f.url !== url));

  const handleSubmit = async () => {
    const result = manualVerificationSchema.safeParse({
      store_name:        data.store_name.trim(),
      store_description: data.store_description.trim(),
      store_category:    data.store_category,
      no_cnpj_reason:    data.no_cnpj_reason.trim(),
    });
    if (!result.success) {
      toast.error(firstError(result.error));
      return;
    }
    if (files.filter((f) => f.type === "store_photo").length === 0) {
      toast.error("Adicione pelo menos uma foto da loja.");
      return;
    }
    await onSubmit(data, files);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button type="button" onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div>
        <h2 className="text-xl font-extrabold">Verificação manual</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha as informações abaixo para solicitar análise. Sua conta será liberada após aprovação.
        </p>
      </div>

      {/* Dados da loja */}
      <section className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <h3 className="font-extrabold text-base">Dados da loja</h3>
        <TextField label="Nome da loja *" value={data.store_name} onChange={(v) => set("store_name", v)} placeholder="Ex.: Empório da Maria" />
        <TextField label="Descrição da atividade *" value={data.store_description} onChange={(v) => set("store_description", v)}
          placeholder="O que você vende? Como funciona seu negócio?" multiline />
        <ChipSelect label="Categoria *" value={data.store_category} onChange={(v) => set("store_category", v)} options={CATEGORIES} />
        <ChipSelect label="Tempo de atuação" value={data.business_duration} onChange={(v) => set("business_duration", v)} options={DURATIONS} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Cidade" value={data.city} onChange={(v) => set("city", v)} placeholder="Ex.: São Paulo" />
          <TextField label="Bairro" value={data.neighborhood} onChange={(v) => set("neighborhood", v)} placeholder="Ex.: Pinheiros" />
        </div>
      </section>

      {/* Redes sociais */}
      <section className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <h3 className="font-extrabold text-base">Redes sociais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SocialField label="Instagram" icon={AtSign} value={data.instagram} onChange={(v) => set("instagram", v)} placeholder="@sua_loja" />
          <SocialField label="Facebook" icon={Globe2} value={data.facebook} onChange={(v) => set("facebook", v)} placeholder="facebook.com/sua_loja" />
          <SocialField label="TikTok" icon={AtSign} value={data.tiktok} onChange={(v) => set("tiktok", v)} placeholder="@sua_loja" />
          <SocialField label="WhatsApp Comercial" icon={Phone} value={data.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="(11) 9 9999-0000" />
          <div className="sm:col-span-2">
            <SocialField label="Site (opcional)" icon={Globe2} value={data.website} onChange={(v) => set("website", v)} placeholder="www.sualoja.com.br" type="url" />
          </div>
        </div>
      </section>

      {/* Evidências */}
      <section className="bg-card rounded-2xl p-5 shadow-card space-y-5">
        <div>
          <h3 className="font-extrabold text-base">Evidências da existência da loja</h3>
          <p className="text-xs text-muted-foreground mt-1">Fotos e documentos que comprovem que sua loja existe e está ativa.</p>
        </div>
        <MultiUpload label="Fotos da loja * (fachada, interior, estoque)" type="store_photo" files={files} onAdd={handleUpload} onRemove={removeFile} accept="image/*" busy={uploadBusy} />
        <MultiUpload label="Fotos dos produtos" type="product_photo" files={files} onAdd={handleUpload} onRemove={removeFile} accept="image/*" busy={uploadBusy} />
        <MultiUpload label="Comprovantes ou documentos (opcional)" type="document" files={files} onAdd={handleUpload} onRemove={removeFile} accept="image/*,.pdf,.doc,.docx" busy={uploadBusy} />
        <div className="bg-muted/40 rounded-xl p-3 flex items-start gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">Aceitos: JPG, PNG, WebP, PDF · Máx. 10 MB por arquivo</p>
        </div>
      </section>

      {/* Informações adicionais */}
      <section className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <h3 className="font-extrabold text-base">Informações adicionais</h3>
        <TextField label="Por que não possui CNPJ? *" value={data.no_cnpj_reason} onChange={(v) => set("no_cnpj_reason", v)} multiline
          placeholder="Ex.: Sou empreendedor informal, ainda estou estruturando a formalização..." />
        <TextField label="Observações (opcional)" value={data.observations} onChange={(v) => set("observations", v)} multiline
          placeholder="Qualquer informação adicional que possa ajudar na análise..." />
      </section>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Após o envio, sua conta permanecerá <strong>restrita</strong> até a aprovação da equipe Vendy+.
          O prazo de análise é de <strong>2 a 5 dias úteis</strong>.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={busy || uploadBusy}
        className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy ? "Enviando solicitação..." : "Enviar solicitação de verificação"}
        {!busy && <BadgeCheck className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Componente raiz
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SellerVerification = () => {
  const { user, refreshVerified } = useAuth();
  const [status,         setStatus]         = useState<VerifStatus>("pending");
  const [hasCnpj,        setHasCnpj]        = useState(false);
  const [storeName,      setStoreName]       = useState<string | undefined>();
  const [verifRecord,    setVerifRecord]     = useState<VerifRecord | null>(null);
  const [verifDetails,   setVerifDetails]    = useState<VerifDetails>({ method: "unknown" });
  const [loading,        setLoading]         = useState(true);
  const [busy,           setBusy]            = useState(false);
  const [refreshing,     setRefreshing]      = useState(false);
  const [showManualForm, setShowManualForm]  = useState(false);

  // initialData começa vazio e é preenchido após o fetch do perfil
  const [initialData, setInitialData] = useState<Partial<ManualFormData>>({});

  const isNewSignup = !!(user && sessionStorage.getItem(`new_signup_${user.id}`));

  // Limpa o flag de new_signup na primeira renderização
  useEffect(() => {
    if (isNewSignup && user) sessionStorage.removeItem(`new_signup_${user.id}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Re-verifica status no banco (botão manual + fallback pós-aprovação)
  const refreshStatus = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("verified")
        .eq("id", user.id)
        .maybeSingle();

      if (prof?.verified) {
        await refreshVerified();
        setStatus("verified");
        return;
      }

      // Verifica se o status da solicitação mudou para rejected
      const { data: verifs } = await supabase
        .from("seller_verifications" as never)
        .select("id, status, rejection_reason, submitted_at")
        .eq("seller_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1) as { data: VerifRecord[] | null };

      if (verifs && verifs.length > 0) {
        const v = verifs[0];
        setVerifRecord(v);
        if (v.status === "approved") {
          // Mesmo caminho de auto-correção: garante verified=true antes de liberar
          await supabase.from("profiles").update({ verified: true }).eq("id", user.id);
          await refreshVerified();
          setStatus("verified");
        } else if (v.status === "rejected") {
          setStatus("rejected");
        } else {
          toast.info("Solicitação ainda em análise. Você será notificado quando houver resposta.");
        }
      } else {
        toast.info("Solicitação ainda em análise.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Assinatura Realtime: detecta aprovação automaticamente sem precisar recarregar
  useEffect(() => {
    if (!user || status !== "in_review") return;

    const channel = supabase
      .channel(`profile-verify-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        async (payload) => {
          const updated = payload.new as { verified?: boolean };
          if (updated.verified === true) {
            await refreshVerified();
            setStatus("verified");
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, status]);

  // Carrega perfil e status de verificação
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("verified, cnpj, extras, display_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      const ext = (prof?.extras as Record<string, string>) ?? {};

      // Fallback: user_metadata.extras contém os dados do signup mas pode não ter
      // chegado a profiles.extras quando o Supabase exige confirmação de e-mail.
      const meta = (user.user_metadata?.extras as Record<string, string>) ?? {};

      // ── Pré-preenchimento rico a partir de todos os campos disponíveis ──
      const storeName = ext.storeName || meta.storeName || "";
      setStoreName(storeName || undefined);
      setInitialData({
        store_name:        storeName,
        store_description: ext.storeDescription || ext.description      || meta.storeDescription || "",
        store_category:    ext.storeCategory    || ext.category         || meta.storeCategory    || meta.category || "",
        city:              ext.city             || ext.storeCity        || meta.city             || "",
        neighborhood:      ext.neighborhood     || ext.storeNeighborhood|| ext.address           || meta.neighborhood || meta.address || "",
        instagram:         ext.instagram        || ext.storeInstagram   || meta.instagram        || "",
        facebook:          ext.facebook         || ext.storeFacebook    || meta.facebook         || "",
        tiktok:            ext.tiktok           || ext.storeTiktok      || meta.tiktok           || "",
        // telefone cadastrado como whatsapp comercial (melhor do que vazio)
        whatsapp:          ext.whatsapp         || ext.storeWhatsapp    || meta.whatsapp         || prof?.phone || "",
        website:           ext.website          || ext.storeWebsite     || meta.website          || "",
      });

      // Busca a verificação manual mais recente (sempre, não só quando não verificado)
      const { data: verifs } = await supabase
        .from("seller_verifications" as never)
        .select("id, status, rejection_reason, submitted_at, reviewed_at")
        .eq("seller_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1) as { data: (VerifRecord & { reviewed_at?: string | null })[] | null };

      const latestVerif = verifs?.[0] ?? null;
      if (latestVerif) setVerifRecord(latestVerif);

      if (prof?.verified) {
        // Monta detalhes da aprovação para a página de status
        setVerifDetails({
          storeName:     ext.storeName || undefined,
          approvedAt:    latestVerif?.reviewed_at ?? null,
          method:        prof?.cnpj ? "cnpj" : latestVerif ? "manual" : "unknown",
          verifId:       latestVerif?.id,
          isFirstAccess: isNewSignup,
        });
        setStatus("verified");
        setLoading(false);
        return;
      }

      if (latestVerif) {
        if (latestVerif.status === "approved") {
          // Auto-correção: admin aprovou mas profiles.verified não foi atualizado por RLS
          await supabase.from("profiles").update({ verified: true }).eq("id", user.id);
          await refreshVerified();
          setVerifDetails({
            storeName:     ext.storeName || undefined,
            approvedAt:    latestVerif.reviewed_at ?? null,
            method:        "manual",
            verifId:       latestVerif.id,
            isFirstAccess: isNewSignup,
          });
          setStatus("verified");
        } else if (latestVerif.status === "rejected") {
          setStatus("rejected");
        } else {
          setStatus("in_review");
        }
      } else if (prof?.cnpj) {
        setStatus("in_review"); setHasCnpj(true);
      } else {
        setStatus("pending");
      }
      setLoading(false);
    })();
  }, [user]);

  const handleCnpjSubmit = async (cnpj: string) => {
    if (!user) return;
    if (!isValidCnpj(cnpj)) { toast.error("CNPJ inválido."); return; }
    setBusy(true);
    try {
      // Valida contra a Receita Federal e salva via service_role (Edge Function)
      // para não depender de RLS do cliente — impede auto-verificação fraudulenta.
      const { data, error } = await supabase.functions.invoke("validate-cnpj", {
        body: { cnpj: onlyDigits(cnpj) },
      });
      if (error) throw error;
      if (!data?.valid) throw new Error(data?.error ?? "CNPJ inválido ou não encontrado na Receita Federal.");
      await refreshVerified();
      toast.success("CNPJ válido! Loja verificada e acesso liberado.");
      setStatus("verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao validar CNPJ.");
    } finally {
      setBusy(false);
    }
  };

  const handleManualSubmit = async (data: ManualFormData, files: UploadedFile[]) => {
    if (!user) return;
    setBusy(true);
    try {
      // Salva nos extras do perfil para pré-preencher em reattempts
      const { data: profData } = await supabase.from("profiles").select("extras").eq("id", user.id).maybeSingle();
      const mergedExtras = {
        ...((profData?.extras as Record<string, string>) ?? {}),
        storeName:        data.store_name,
        storeDescription: data.store_description,
        storeCategory:    data.store_category,
        city:             data.city,
        neighborhood:     data.neighborhood,
        instagram:        data.instagram,
        facebook:         data.facebook,
        tiktok:           data.tiktok,
        whatsapp:         data.whatsapp,
        website:          data.website,
      };
      await supabase.from("profiles").update({ extras: mergedExtras }).eq("id", user.id);

      // Insere na tabela seller_verifications
      const { data: inserted, error: insErr } = await supabase
        .from("seller_verifications" as never)
        .insert({
          seller_id:         user.id,
          store_name:        data.store_name,
          store_description: data.store_description,
          store_category:    data.store_category,
          business_duration: data.business_duration,
          city:              data.city,
          neighborhood:      data.neighborhood,
          instagram:         data.instagram,
          facebook:          data.facebook,
          tiktok:            data.tiktok,
          whatsapp:          data.whatsapp,
          website:           data.website,
          observations:      data.observations,
          no_cnpj_reason:    data.no_cnpj_reason,
          status:            "pending",
        } as never)
        .select("id")
        .single() as { data: { id: string } | null; error: unknown };

      if (insErr || !inserted) throw insErr ?? new Error("Erro ao criar solicitação.");

      if (files.length > 0) {
        await supabase.from("seller_verification_files" as never).insert(
          files.map((f) => ({
            verification_id: inserted.id,
            file_url:        f.url,
            file_type:       f.type,
          })) as never
        );
      }

      toast.success("Solicitação enviada! Nossa equipe analisará em até 5 dias úteis.");
      setVerifRecord({ id: inserted.id, status: "pending", rejection_reason: null, submitted_at: new Date().toISOString() });
      setStatus("in_review");
      setShowManualForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar solicitação.");
    } finally {
      setBusy(false);
    }
  };

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

  if (status === "verified") return <VerifiedStatusPage details={verifDetails} />;
  if (status === "in_review") return <InReviewScreen hasCnpj={hasCnpj} record={verifRecord} onRefresh={refreshStatus} refreshing={refreshing} />;
  if (status === "rejected") return (
    <RejectedScreen
      reason={verifRecord?.rejection_reason}
      onRetry={() => { setVerifRecord(null); setStatus("pending"); setShowManualForm(true); }}
    />
  );

  const WelcomeBanner = isNewSignup ? (
    <div className="bg-success/10 border border-success/20 rounded-2xl p-4 flex items-start gap-3">
      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-bold text-success">Conta criada com sucesso!</p>
        <p className="text-xs text-success/80 mt-0.5 leading-relaxed">
          Agora complete a verificação para liberar seu acesso ao painel e começar a vender.
        </p>
      </div>
    </div>
  ) : null;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto space-y-6">
      {WelcomeBanner}

      {/* Indicador de progresso inline — substituindo o OnboardingLayout que foi removido */}
      {!showManualForm && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-success font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Criar conta</span>
          <span className="text-border">—</span>
          <span className="flex items-center gap-1 text-success font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Configurar loja</span>
          <span className="text-border">—</span>
          <span className="flex items-center gap-1 text-primary font-bold"><span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">3</span> Verificação</span>
        </div>
      )}

      {showManualForm ? (
        <ManualForm
          initialData={initialData}
          onSubmit={handleManualSubmit}
          onBack={() => setShowManualForm(false)}
          busy={busy}
        />
      ) : (
        <>
          {/* Voltar para etapa 2 (configuração da loja) */}
          <Link
            to="/lojista/criar-loja"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para configuração da loja
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conta da loja</p>
              <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Verificação da loja</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Verifique sua loja para liberar o acesso ao sistema e receber o selo de confiança.
              </p>
            </div>
            <span className="rounded-full bg-warning/10 border border-warning/20 px-3 py-1.5 text-xs font-bold text-warning w-fit flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Acesso restrito — verificação necessária
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CnpjForm onSubmit={handleCnpjSubmit} busy={busy} />
            <section className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg">Verificação manual</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Para empreendedores sem CNPJ. Envie evidências e aguarde análise da equipe.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Fotos da loja e produtos", "Redes sociais comerciais", "Descrição detalhada da atividade", "Análise em 2 a 5 dias úteis"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowManualForm(true)}
                disabled={busy}
                className="w-full border-2 border-primary text-primary rounded-xl py-3 font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                Preencher formulário de verificação
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Seu acesso permanece restrito até a aprovação.
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default SellerVerification;
