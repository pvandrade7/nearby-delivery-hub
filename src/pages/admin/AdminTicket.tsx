import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Send, CheckCircle2, XCircle, Clock,
  MessageSquare, User, Tag, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Ticket = {
  id: string; user_id: string | null; user_email: string | null;
  user_name: string | null; subject: string; category: string;
  status: string; created_at: string; updated_at: string;
};

type Message = {
  id: string; ticket_id: string; sender_id: string | null;
  sender_name: string | null; message: string;
  is_admin: boolean; created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto", em_andamento: "Em andamento", resolvido: "Resolvido",
  encerrado: "Encerrado", aguardando: "Aguardando usuário",
};
const STATUS_STYLE: Record<string, string> = {
  aberto: "bg-destructive/10 text-destructive",
  em_andamento: "bg-warning/15 text-warning-foreground",
  resolvido: "bg-success/10 text-success",
  encerrado: "bg-muted text-muted-foreground",
  aguardando: "bg-blue-500/10 text-blue-600",
};
const CATEGORY_LABEL: Record<string, string> = {
  pedidos: "Pedidos", pagamentos: "Pagamentos", entregas: "Entregas",
  conta: "Conta", denuncia: "Denúncia", sugestao: "Sugestão",
  duvida: "Dúvida geral", verificacao: "Verificação de lojista",
};

const AdminTicket = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const bottomRef      = useRef<HTMLDivElement>(null);

  const [ticket,   setTicket]   = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply,    setReply]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ticketRes, msgsRes] = await Promise.all([
        supabase.from("support_tickets").select("*").eq("id", id).maybeSingle(),
        supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at"),
      ]);
      setTicket(ticketRes.data as Ticket ?? null);
      setMessages((msgsRes.data as Message[]) ?? []);
    } catch { /* tabelas não criadas */ }
    setLoading(false);
  };

  useEffect(() => { void fetchAll(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !ticket || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id:   ticket.id,
        sender_id:   user.id,
        sender_name: user.email?.split("@")[0] ?? "Admin",
        message:     reply.trim(),
        is_admin:    true,
      });
      if (error) throw error;
      await supabase.from("support_tickets").update({
        status:     "em_andamento",
        updated_at: new Date().toISOString(),
      }).eq("id", ticket.id);
      setReply("");
      await fetchAll();
      toast.success("Resposta enviada.");
    } catch { toast.error("Erro ao enviar resposta."); }
    setSending(false);
  };

  const changeStatus = async (status: string) => {
    if (!ticket) return;
    await supabase.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticket.id);
    setTicket((t) => t ? { ...t, status } : t);
    toast.success(`Status alterado para "${STATUS_LABEL[status]}".`);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!ticket) return (
    <div className="p-8 text-center">
      <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
      <p className="font-semibold text-muted-foreground">Chamado não encontrado.</p>
      <button onClick={() => navigate("/admin/suporte")} className="text-primary mt-2 font-semibold hover:underline">
        Voltar
      </button>
    </div>
  );

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/suporte")}
          className="size-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold leading-tight truncate">{ticket.subject}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${STATUS_STYLE[ticket.status] ?? "bg-muted"}`}>
              {STATUS_LABEL[ticket.status] ?? ticket.status}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />{ticket.user_name ?? ticket.user_email ?? "Anônimo"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3" />{CATEGORY_LABEL[ticket.category] ?? ticket.category}
            </span>
          </div>
        </div>
      </div>

      {/* Ações de status */}
      <div className="bg-card rounded-2xl p-4 shadow-card flex flex-wrap gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-full mb-1">Alterar status</p>
        {[
          { key: "em_andamento", label: "Em andamento", icon: Clock,        cls: "bg-warning/15 text-warning-foreground hover:bg-warning/25"  },
          { key: "aguardando",   label: "Aguardando",   icon: MessageSquare,cls: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"           },
          { key: "resolvido",    label: "Resolver",     icon: CheckCircle2, cls: "bg-success/10 text-success hover:bg-success/20"             },
          { key: "encerrado",    label: "Encerrar",     icon: XCircle,      cls: "bg-muted text-muted-foreground hover:bg-muted/70"           },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => changeStatus(s.key)}
            disabled={ticket.status === s.key}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-40 ${s.cls}`}
          >
            <s.icon className="w-3.5 h-3.5" />{s.label}
          </button>
        ))}
      </div>

      {/* Thread de mensagens */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold text-sm">Conversa ({messages.length} mensagem{messages.length !== 1 ? "s" : ""})</h2>
        </div>
        <div className="px-5 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma mensagem ainda.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.is_admin ? "flex-row-reverse" : ""}`}>
                <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.is_admin ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {m.is_admin ? "A" : (m.sender_name?.[0] ?? "U").toUpperCase()}
                </div>
                <div className={`max-w-[75%] ${m.is_admin ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                    m.is_admin
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}>
                    {m.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {m.sender_name ?? (m.is_admin ? "Admin" : "Usuário")} ·{" "}
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Caixa de resposta */}
        {ticket.status !== "encerrado" ? (
          <div className="border-t border-border p-4 flex gap-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) sendReply(); }}
              placeholder="Escreva sua resposta... (Ctrl+Enter para enviar)"
              rows={3}
              className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={sendReply}
              disabled={!reply.trim() || sending}
              className="self-end gradient-brand text-primary-foreground px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-card hover:shadow-elevated transition-shadow disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        ) : (
          <div className="border-t border-border p-4">
            <p className="text-sm text-muted-foreground text-center">Este chamado está encerrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTicket;
