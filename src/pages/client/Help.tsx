import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronDown, ChevronUp, Send, Ticket,
  Clock, CheckCircle2, MessageSquare, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FAQS = [
  { q: "Como faço para rastrear meu pedido?",         a: "Acesse 'Meus Pedidos' no menu inferior e clique no pedido desejado para ver o status em tempo real."         },
  { q: "Posso cancelar um pedido?",                   a: "Pedidos podem ser cancelados enquanto o lojista ainda não os confirmou. Acesse o pedido e toque em 'Cancelar'." },
  { q: "Como altero meu endereço de entrega?",        a: "Vá em 'Meu Perfil' → 'Endereços salvos' para gerenciar seus endereços."                                       },
  { q: "Meu pedido está atrasado, o que faço?",       a: "Abra um chamado de suporte usando o formulário abaixo. Nossa equipe responderá em até 24h."                    },
  { q: "Como adiciono um cartão de pagamento?",       a: "Acesse 'Meu Perfil' → 'Formas de pagamento' e toque em 'Adicionar cartão'."                                    },
  { q: "Como verifico minha loja como lojista?",      a: "Acesse o Painel → Verificação e envie suas informações. Nossa equipe analisará em até 48h."                    },
];

const CATEGORIES = [
  { value: "pedidos",     label: "Problema com pedido"       },
  { value: "pagamentos",  label: "Problema com pagamento"    },
  { value: "entregas",    label: "Problema com entrega"      },
  { value: "conta",       label: "Problema com minha conta"  },
  { value: "denuncia",    label: "Denúncia"                  },
  { value: "verificacao", label: "Verificação de lojista"    },
  { value: "sugestao",    label: "Sugestão"                  },
  { value: "duvida",      label: "Dúvida geral"              },
];

const STATUS_LABEL: Record<string, string> = {
  aberto:       "Aberto",
  em_andamento: "Em andamento",
  resolvido:    "Resolvido",
  encerrado:    "Encerrado",
  aguardando:   "Aguardando resposta",
};
const STATUS_STYLE: Record<string, string> = {
  aberto:       "bg-destructive/10 text-destructive",
  em_andamento: "bg-warning/15 text-warning-foreground",
  resolvido:    "bg-success/10 text-success",
  encerrado:    "bg-muted text-muted-foreground",
  aguardando:   "bg-blue-500/10 text-blue-600",
};

type MyTicket = {
  id:         string;
  subject:    string;
  category:   string;
  status:     string;
  created_at: string;
};

export default function Help() {
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const [openFaq,   setOpenFaq]  = useState<number | null>(null);
  const [category,  setCategory] = useState(CATEGORIES[7].value);
  const [subject,   setSubject]  = useState("");
  const [message,   setMessage]  = useState("");
  const [sending,   setSending]  = useState(false);
  const [myTickets, setMyTickets]= useState<MyTicket[]>([]);
  const [tab,       setTab]      = useState<"novo" | "meus">("novo");

  const fetchMyTickets = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, subject, category, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyTickets((data as MyTicket[]) ?? []);
    } catch { /* tabela ainda não criada */ }
  };

  useEffect(() => { void fetchMyTickets(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Preencha o assunto e a mensagem.");
      return;
    }
    setSending(true);
    try {
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id:    user?.id    ?? null,
          user_email: user?.email ?? null,
          user_name:  user?.email?.split("@")[0] ?? null,
          subject:    subject.trim(),
          category,
          status:     "aberto",
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("ticket_messages").insert({
        ticket_id:   ticket.id,
        sender_id:   user?.id    ?? null,
        sender_name: user?.email?.split("@")[0] ?? "Cliente",
        message:     message.trim(),
        is_admin:    false,
      });

      toast.success("Chamado aberto! Nossa equipe responderá em breve.");
      setSubject(""); setMessage("");
      setTab("meus");
      await fetchMyTickets();
    } catch {
      toast.error("Não foi possível abrir o chamado. Tente novamente.");
    }
    setSending(false);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold">Ajuda & Suporte</h1>
      </div>

      {/* FAQ */}
      <h2 className="font-extrabold text-base mb-3">Perguntas frequentes</h2>
      <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-6">
        {FAQS.map((faq, i) => (
          <div key={i} className="border-b border-border last:border-0">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="flex-1 text-sm font-semibold">{faq.q}</span>
              {openFaq === i
                ? <ChevronUp   className="w-4 h-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
            {openFaq === i && (
              <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs: Novo chamado / Meus chamados */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("novo")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "novo"
              ? "gradient-brand text-primary-foreground shadow-card"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Send className="w-4 h-4" /> Abrir chamado
        </button>
        <button
          onClick={() => setTab("meus")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "meus"
              ? "gradient-brand text-primary-foreground shadow-card"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Ticket className="w-4 h-4" /> Meus chamados
          {myTickets.filter((t) => t.status === "em_andamento").length > 0 && (
            <span className="bg-white/25 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {myTickets.filter((t) => t.status === "em_andamento").length}
            </span>
          )}
        </button>
      </div>

      {/* ── Formulário de novo chamado ───────────────── */}
      {tab === "novo" && (
        <div className="bg-card rounded-2xl shadow-card p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Assunto
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Descreva brevemente seu problema"
              maxLength={120}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva com detalhes o que aconteceu..."
              rows={5}
              maxLength={1000}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">{message.length}/1000</p>
          </div>

          {!user && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              Você não está logado. O chamado será aberto de forma anônima.
            </p>
          )}

          <button
            onClick={openTicket}
            disabled={sending}
            className="w-full py-3.5 rounded-xl gradient-brand text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {sending ? "Enviando..." : <><Send className="w-4 h-4" /> Abrir chamado</>}
          </button>
        </div>
      )}

      {/* ── Meus chamados ────────────────────────────── */}
      {tab === "meus" && (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {!user ? (
            <div className="text-center py-12 text-muted-foreground px-6">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Faça login para ver seus chamados</p>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground px-6">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Nenhum chamado aberto</p>
              <p className="text-sm mt-1">Abra um chamado na aba ao lado se precisar de ajuda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myTickets.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-4">
                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${STATUS_STYLE[t.status] ?? "bg-muted"}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{t.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status] ?? "bg-muted"}`}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  {t.status === "resolvido" && (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
