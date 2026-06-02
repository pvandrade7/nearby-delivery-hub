import { useEffect, useState } from "react";
import {
  BadgeCheck, Ban, CheckCircle2, RotateCcw, XCircle,
  Clock, ExternalLink, ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VerifStatus = "nao_verificado" | "pendente" | "em_analise" | "verificado" | "rejeitado" | "mais_info";

type VerifRequest = {
  id:         string;
  storeName:  string;
  sellerName: string;
  category:   string;
  address:    string;
  instagram:  string;
  facebook:   string;
  whatsapp:   string;
  description:string;
  status:     VerifStatus;
  submittedAt:string;
  adminNotes: string;
  extras:     Record<string, string>;
};

const STATUS_LABEL: Record<VerifStatus, string> = {
  nao_verificado: "Não verificado",
  pendente:       "Pendente",
  em_analise:     "Em análise",
  verificado:     "Verificado",
  rejeitado:      "Rejeitado",
  mais_info:      "Necessita info",
};
const STATUS_STYLE: Record<VerifStatus, string> = {
  nao_verificado: "bg-muted text-muted-foreground",
  pendente:       "bg-warning/20 text-warning-foreground",
  em_analise:     "bg-blue-500/15 text-blue-600",
  verificado:     "bg-success/15 text-success",
  rejeitado:      "bg-destructive/10 text-destructive",
  mais_info:      "bg-amber-500/15 text-amber-600",
};

const AdminVerification = () => {
  const [requests, setRequests] = useState<VerifRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes,    setNotes]    = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, extras, verified, cnpj, created_at")
        .not("extras", "is", null);

      const items: VerifRequest[] = (data ?? [])
        .filter((p) => {
          const ext = p.extras as Record<string, string> | null;
          return ext?.storeName && (ext?.verificationStatus || p.verified !== null);
        })
        .map((p) => {
          const ext = (p.extras as Record<string, string>) ?? {};
          return {
            id:          p.id,
            storeName:   ext.storeName    || "Loja sem nome",
            sellerName:  ext.storeEmail   || p.id.slice(0, 8),
            category:    ext.storeCategory|| "—",
            address:     ext.storeAddress || "—",
            instagram:   ext.storeInstagram || "",
            facebook:    ext.storeFacebook  || "",
            whatsapp:    ext.storeWhatsapp  || "",
            description: ext.storeDescription || "",
            status:      (ext.verificationStatus as VerifStatus) || (p.verified ? "verificado" : "nao_verificado"),
            submittedAt: new Date(p.created_at).toLocaleDateString("pt-BR"),
            adminNotes:  ext.adminNotes || "",
            extras:      ext,
          };
        });
      setRequests(items);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { void fetchRequests(); }, []);

  const updateStatus = async (id: string, status: VerifStatus) => {
    const req     = requests.find((r) => r.id === id);
    if (!req) return;
    const extras  = {
      ...req.extras,
      verificationStatus: status,
      adminNotes: notes[id] ?? req.adminNotes,
    };
    const verified = status === "verificado";
    const { error } = await supabase
      .from("profiles")
      .update({ extras, verified })
      .eq("id", id);

    if (error) { toast.error("Erro ao atualizar."); return; }
    setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status, adminNotes: extras.adminNotes } : r));
    toast.success(`Status de "${req.storeName}" alterado para "${STATUS_LABEL[status]}".`);
  };

  const counts = {
    pendente:   requests.filter((r) => r.status === "pendente").length,
    em_analise: requests.filter((r) => r.status === "em_analise").length,
    verificado: requests.filter((r) => r.status === "verificado").length,
    rejeitado:  requests.filter((r) => r.status === "rejeitado").length,
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administração</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Verificação de Lojistas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Aprovação manual de lojistas sem CNPJ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pendentes",   value: counts.pendente,   icon: Clock,        cls: "text-warning bg-warning/10"         },
          { label: "Em análise",  value: counts.em_analise, icon: BadgeCheck,   cls: "text-blue-600 bg-blue-500/10"       },
          { label: "Verificados", value: counts.verificado, icon: CheckCircle2, cls: "text-success bg-success/10"         },
          { label: "Rejeitados",  value: counts.rejeitado,  icon: XCircle,      cls: "text-destructive bg-destructive/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
            <div className={`size-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-border">
          <h2 className="font-bold text-base">Solicitações ({requests.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nenhuma solicitação de verificação</p>
            <p className="text-sm mt-1">Quando lojistas solicitarem verificação, aparecerão aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {requests.map((req) => (
              <div key={req.id}>
                {/* Linha principal */}
                <div className="flex items-center gap-4 px-5 lg:px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-sm">{req.storeName}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${STATUS_STYLE[req.status]}`}>
                        {STATUS_LABEL[req.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.category} · cadastrado em {req.submittedAt}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateStatus(req.id, "em_analise")}
                      disabled={req.status === "em_analise"}
                      title="Marcar em análise"
                      className="size-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, "verificado")}
                      disabled={req.status === "verificado"}
                      title="Aprovar"
                      className="size-9 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 disabled:opacity-40 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, "mais_info")}
                      disabled={req.status === "mais_info"}
                      title="Solicitar mais informações"
                      className="size-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, "rejeitado")}
                      disabled={req.status === "rejeitado"}
                      title="Rejeitar"
                      className="size-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 disabled:opacity-40 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                      className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/70 transition-colors"
                    >
                      {expanded === req.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expanded === req.id && (
                  <div className="px-5 lg:px-6 pb-5 space-y-4 bg-muted/20 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {req.description && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
                          <p className="text-sm text-foreground leading-relaxed">{req.description}</p>
                        </div>
                      )}
                      {req.address && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Endereço</p>
                          <p className="text-sm">{req.address}</p>
                        </div>
                      )}
                      {req.instagram && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Instagram</p>
                          <a href={`https://instagram.com/${req.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                            className="text-sm text-primary flex items-center gap-1 hover:underline">
                            {req.instagram} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {req.facebook && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Facebook</p>
                          <p className="text-sm">{req.facebook}</p>
                        </div>
                      )}
                      {req.whatsapp && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">WhatsApp</p>
                          <a href={`https://wa.me/${req.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                            className="text-sm text-primary flex items-center gap-1 hover:underline">
                            {req.whatsapp} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Observações do admin */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Observações internas</p>
                      <textarea
                        value={notes[req.id] ?? req.adminNotes}
                        onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                        placeholder="Adicione observações internas sobre esta solicitação..."
                        rows={2}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => updateStatus(req.id, req.status)}
                      className="text-xs font-bold px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Salvar observações
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;
