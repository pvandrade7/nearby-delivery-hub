import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, AtSign,
  Globe2, Phone, Image as ImageIcon, FileText, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ── tipos ────────────────────────────────────────────────
type VerifStatus = "pending" | "in_review" | "approved" | "rejected";

type VerifFile = { id: string; file_url: string; file_type: string };

type VerifRequest = {
  id:                string;
  seller_id:         string;
  seller_name:       string;
  seller_email:      string;
  store_name:        string | null;
  store_description: string | null;
  store_category:    string | null;
  business_duration: string | null;
  city:              string | null;
  neighborhood:      string | null;
  instagram:         string | null;
  facebook:          string | null;
  tiktok:            string | null;
  whatsapp:          string | null;
  website:           string | null;
  observations:      string | null;
  no_cnpj_reason:    string | null;
  status:            VerifStatus;
  submitted_at:      string;
  reviewed_at:       string | null;
  rejection_reason:  string | null;
  files:             VerifFile[];
};

const STATUS_LABEL: Record<VerifStatus, string> = {
  pending:   "Pendente",
  in_review: "Em análise",
  approved:  "Aprovado",
  rejected:  "Rejeitado",
};
const STATUS_STYLE: Record<VerifStatus, string> = {
  pending:   "bg-warning/20 text-warning-foreground",
  in_review: "bg-blue-500/15 text-blue-600",
  approved:  "bg-success/15 text-success",
  rejected:  "bg-destructive/10 text-destructive",
};

// ── modal de rejeição ────────────────────────────────────
const RejectModal = ({
  storeName, onConfirm, onCancel, busy,
}: {
  storeName: string; onConfirm: (reason: string) => void;
  onCancel: () => void; busy: boolean;
}) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-elevated w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg">Reprovar verificação</h2>
          <button onClick={onCancel} className="size-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Informe o motivo da reprovação de <strong>{storeName}</strong>. O lojista poderá visualizar este motivo.
        </p>
        <textarea
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: As fotos enviadas não mostram claramente a existência do estabelecimento..."
          rows={4}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()); else toast.error("Informe o motivo da reprovação."); }}
            disabled={busy || !reason.trim()}
            className="flex-1 bg-destructive text-white rounded-xl py-2.5 text-sm font-bold hover:bg-destructive/90 disabled:opacity-60 transition-colors"
          >
            {busy ? "Reprovando..." : "Confirmar reprovação"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── lightbox de imagem ───────────────────────────────────
const Lightbox = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
    <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
    <button onClick={onClose} className="absolute top-4 right-4 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
      <X className="w-5 h-5" />
    </button>
  </div>
);

// ── card de arquivo ──────────────────────────────────────
const FileCard = ({ file, onPreview }: { file: VerifFile; onPreview: (url: string) => void }) => {
  const isImage = /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.file_url);
  const label = file.file_type === "store_photo" ? "Loja" : file.file_type === "product_photo" ? "Produto" : "Documento";
  return (
    <button type="button" onClick={() => isImage ? onPreview(file.file_url) : window.open(file.file_url, "_blank")}
      className="relative w-24 h-24 rounded-xl border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all group">
      {isImage ? (
        <img src={file.file_url} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1">
          <FileText className="w-6 h-6 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-semibold">{label}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <ExternalLink className="w-5 h-5 text-white" />
      </div>
      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        {label}
      </span>
    </button>
  );
};

// ── componente principal ─────────────────────────────────
const AdminVerification = () => {
  const { user } = useAuth();
  const [requests,    setRequests]    = useState<VerifRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actionBusy,  setActionBusy]  = useState(false);
  const [lightbox,    setLightbox]    = useState<string | null>(null);
  const [filter,      setFilter]      = useState<VerifStatus | "all">("all");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // 1 query: todas as verificações
      const { data: verifs, error } = await supabase
        .from("seller_verifications" as never)
        .select("*")
        .order("submitted_at", { ascending: false }) as { data: Record<string, unknown>[] | null; error: unknown };

      if (error) throw error;
      if (!verifs || verifs.length === 0) { setRequests([]); setLoading(false); return; }

      const sellerIds    = [...new Set(verifs.map((v) => v.seller_id as string))];
      const verifIds     = verifs.map((v) => v.id as string);

      // 1 query: todos os perfis de uma vez (substitui N queries)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", sellerIds);

      // 1 query: todos os arquivos de uma vez (substitui N queries)
      const { data: allFiles } = await supabase
        .from("seller_verification_files" as never)
        .select("id, file_url, file_type, verification_id")
        .in("verification_id", verifIds) as { data: (VerifFile & { verification_id: string })[] | null };

      // Índices para O(1) lookup
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "Lojista"]));
      const filesMap   = new Map<string, VerifFile[]>();
      for (const f of (allFiles ?? [])) {
        const list = filesMap.get(f.verification_id) ?? [];
        list.push({ id: f.id, file_url: f.file_url, file_type: f.file_type });
        filesMap.set(f.verification_id, list);
      }

      const items: VerifRequest[] = verifs.map((v) => ({
        id:                v.id                as string,
        seller_id:         v.seller_id         as string,
        seller_name:       profileMap.get(v.seller_id as string) ?? "Lojista",
        seller_email:      "",
        store_name:        v.store_name        as string | null,
        store_description: v.store_description as string | null,
        store_category:    v.store_category    as string | null,
        business_duration: v.business_duration as string | null,
        city:              v.city              as string | null,
        neighborhood:      v.neighborhood      as string | null,
        instagram:         v.instagram         as string | null,
        facebook:          v.facebook          as string | null,
        tiktok:            v.tiktok            as string | null,
        whatsapp:          v.whatsapp          as string | null,
        website:           v.website           as string | null,
        observations:      v.observations      as string | null,
        no_cnpj_reason:    v.no_cnpj_reason    as string | null,
        status:            (v.status           as VerifStatus) ?? "pending",
        submitted_at:      v.submitted_at      as string,
        reviewed_at:       v.reviewed_at       as string | null,
        rejection_reason:  v.rejection_reason  as string | null,
        files:             filesMap.get(v.id as string) ?? [],
      }));

      setRequests(items);
    } catch (e) {
      console.error("[AdminVerification]", e);
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => { void fetchRequests(); }, []);

  const markInReview = async (id: string) => {
    setActionBusy(true);
    try {
      const { error } = await supabase
        .from("seller_verifications" as never)
        .update({ status: "in_review", reviewed_by: user?.id ?? null } as never)
        .eq("id", id as never);
      if (error) throw error;
      setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status: "in_review" } : r));
      toast.success("Marcado como em análise.");
    } catch { toast.error("Erro ao atualizar status."); }
    setActionBusy(false);
  };

  const approve = async (req: VerifRequest) => {
    setActionBusy(true);
    try {
      // Atualiza status da verificação
      const { error: vErr } = await supabase
        .from("seller_verifications" as never)
        .update({
          status:      "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
        } as never)
        .eq("id", req.id as never);
      if (vErr) throw vErr;

      // Copia dados da verificação para profiles.extras e concede o selo
      const { data: profData } = await supabase
        .from("profiles").select("extras").eq("id", req.seller_id).maybeSingle();
      const currentExtras = (profData?.extras as Record<string, string>) ?? {};
      const updatedExtras = {
        ...currentExtras,
        storeName:        req.store_name        ?? currentExtras.storeName        ?? "",
        storeDescription: req.store_description ?? currentExtras.storeDescription ?? "",
        storeCategory:    req.store_category    ?? currentExtras.storeCategory    ?? "",
        storeAddress:     [req.neighborhood, req.city].filter(Boolean).join(", ") || currentExtras.storeAddress || "",
      };
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ verified: true, extras: updatedExtras })
        .eq("id", req.seller_id);
      if (pErr) throw pErr;

      setRequests((rs) => rs.map((r) => r.id === req.id ? { ...r, status: "approved" } : r));
      toast.success(`"${req.store_name}" aprovada — selo verificado concedido e acesso liberado.`);
    } catch { toast.error("Erro ao aprovar."); }
    setActionBusy(false);
  };

  const reject = async (req: VerifRequest, reason: string) => {
    setActionBusy(true);
    try {
      const { error } = await supabase
        .from("seller_verifications" as never)
        .update({
          status:           "rejected",
          rejection_reason: reason,
          reviewed_at:      new Date().toISOString(),
          reviewed_by:      user?.id ?? null,
        } as never)
        .eq("id", req.id as never);
      if (error) throw error;

      setRequests((rs) => rs.map((r) => r.id === req.id ? { ...r, status: "rejected", rejection_reason: reason } : r));
      toast.success(`Verificação de "${req.store_name}" reprovada.`);
    } catch { toast.error("Erro ao reprovar."); }
    setActionBusy(false);
    setRejectingId(null);
  };

  const rejectingReq = rejectingId ? requests.find((r) => r.id === rejectingId) : null;

  const counts = {
    pending:   requests.filter((r) => r.status === "pending").length,
    in_review: requests.filter((r) => r.status === "in_review").length,
    approved:  requests.filter((r) => r.status === "approved").length,
    rejected:  requests.filter((r) => r.status === "rejected").length,
  };

  const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administração</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Verificação de Lojistas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análise manual de lojistas sem CNPJ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: "Pendentes",   key: "pending"   as const, icon: Clock,        cls: "text-warning bg-warning/10"         },
          { label: "Em análise",  key: "in_review" as const, icon: BadgeCheck,   cls: "text-blue-600 bg-blue-500/10"       },
          { label: "Aprovados",   key: "approved"  as const, icon: CheckCircle2, cls: "text-success bg-success/10"         },
          { label: "Reprovados",  key: "rejected"  as const, icon: XCircle,      cls: "text-destructive bg-destructive/10" },
        ] as const).map((s) => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={`bg-card rounded-2xl p-5 shadow-card text-left transition-all ${filter === s.key ? "ring-2 ring-primary" : "hover:shadow-elevated"}`}>
            <div className={`size-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold">{counts[s.key]}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-base">
            {filter === "all" ? `Todas as solicitações (${requests.length})` : `${STATUS_LABEL[filter as VerifStatus]} (${visible.length})`}
          </h2>
          {filter !== "all" && (
            <button onClick={() => setFilter("all")} className="text-xs text-muted-foreground hover:text-foreground font-semibold underline-offset-2 hover:underline">
              Ver todas
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nenhuma solicitação encontrada</p>
            <p className="text-sm mt-1">
              {filter === "all"
                ? "Quando lojistas enviarem solicitações de verificação manual, aparecerão aqui."
                : `Nenhuma solicitação com status "${STATUS_LABEL[filter as VerifStatus]}".`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((req) => (
              <div key={req.id}>
                {/* Linha resumo */}
                <div className="flex items-center gap-4 px-5 lg:px-6 py-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-sm">{req.store_name || "Loja sem nome"}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${STATUS_STYLE[req.status]}`}>
                        {STATUS_LABEL[req.status]}
                      </span>
                      {req.files.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> {req.files.length} arquivo(s)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.seller_name} · {req.store_category || "—"} · enviado em {new Date(req.submitted_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === "pending" && (
                      <button onClick={() => markInReview(req.id)} disabled={actionBusy} title="Marcar em análise"
                        className="size-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-500/20 disabled:opacity-40 transition-colors">
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    {(req.status === "pending" || req.status === "in_review") && (
                      <>
                        <button onClick={() => approve(req)} disabled={actionBusy} title="Aprovar e conceder selo"
                          className="size-9 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 disabled:opacity-40 transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRejectingId(req.id)} disabled={actionBusy} title="Reprovar"
                          className="size-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 disabled:opacity-40 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                      className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/70 transition-colors">
                      {expanded === req.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expanded === req.id && (
                  <div className="px-5 lg:px-6 pb-6 space-y-5 bg-muted/20 border-t border-border pt-5">

                    {/* Info da loja */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                      {req.store_description && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Descrição da atividade</p>
                          <p className="text-sm leading-relaxed">{req.store_description}</p>
                        </div>
                      )}
                      {req.no_cnpj_reason && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Por que não tem CNPJ</p>
                          <p className="text-sm leading-relaxed text-warning">{req.no_cnpj_reason}</p>
                        </div>
                      )}
                      {req.business_duration && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Tempo de atuação</p>
                          <p className="text-sm">{req.business_duration}</p>
                        </div>
                      )}
                      {(req.city || req.neighborhood) && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Localização</p>
                          <p className="text-sm">{[req.neighborhood, req.city].filter(Boolean).join(", ")}</p>
                        </div>
                      )}
                      {req.observations && (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Observações do lojista</p>
                          <p className="text-sm leading-relaxed">{req.observations}</p>
                        </div>
                      )}
                    </div>

                    {/* Redes sociais */}
                    {(req.instagram || req.facebook || req.tiktok || req.whatsapp || req.website) && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Redes sociais</p>
                        <div className="flex flex-wrap gap-3">
                          {req.instagram && (
                            <a href={`https://instagram.com/${req.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full">
                              <AtSign className="w-3.5 h-3.5" /> {req.instagram}
                            </a>
                          )}
                          {req.facebook && (
                            <a href={req.facebook.startsWith("http") ? req.facebook : `https://facebook.com/${req.facebook}`} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full">
                              <Globe2 className="w-3.5 h-3.5" /> {req.facebook}
                            </a>
                          )}
                          {req.tiktok && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted px-3 py-1.5 rounded-full">
                              TikTok: {req.tiktok}
                            </span>
                          )}
                          {req.whatsapp && (
                            <a href={`https://wa.me/${req.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full">
                              <Phone className="w-3.5 h-3.5" /> {req.whatsapp}
                            </a>
                          )}
                          {req.website && (
                            <a href={req.website.startsWith("http") ? req.website : `https://${req.website}`} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full">
                              <Globe2 className="w-3.5 h-3.5" /> {req.website}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Arquivos */}
                    {req.files.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          Arquivos enviados ({req.files.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {req.files.map((f) => (
                            <FileCard key={f.id} file={f} onPreview={setLightbox} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Motivo de rejeição */}
                    {req.status === "rejected" && req.rejection_reason && (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">Motivo da reprovação</p>
                        <p className="text-sm text-destructive">{req.rejection_reason}</p>
                      </div>
                    )}

                    {/* Ações dentro do painel expandido (para aprovados/rejeitados que precisam de revisão) */}
                    {(req.status === "pending" || req.status === "in_review") && (
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => approve(req)} disabled={actionBusy}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success text-white text-sm font-bold hover:bg-success/90 disabled:opacity-60 transition-colors shadow-sm">
                          <CheckCircle2 className="w-4 h-4" /> Aprovar e conceder selo
                        </button>
                        <button onClick={() => setRejectingId(req.id)} disabled={actionBusy}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-destructive text-destructive text-sm font-bold hover:bg-destructive/5 disabled:opacity-60 transition-colors">
                          <XCircle className="w-4 h-4" /> Reprovar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de rejeição */}
      {rejectingReq && (
        <RejectModal
          storeName={rejectingReq.store_name ?? "esta loja"}
          onConfirm={(reason) => reject(rejectingReq, reason)}
          onCancel={() => setRejectingId(null)}
          busy={actionBusy}
        />
      )}

      {/* Lightbox */}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
};

export default AdminVerification;
