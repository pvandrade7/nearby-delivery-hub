import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Send } from "lucide-react";
import { toast } from "sonner";

const FAQS = [
  { q: "Como faço para rastrear meu pedido?", a: "Acesse 'Meus Pedidos' no menu inferior e clique no pedido desejado para ver o status em tempo real." },
  { q: "Posso cancelar um pedido?", a: "Pedidos podem ser cancelados enquanto o lojista ainda não os confirmou. Acesse o pedido e toque em 'Cancelar'." },
  { q: "Como altero meu endereço de entrega?", a: "Vá em 'Meu Perfil' → 'Endereços salvos' para gerenciar seus endereços." },
  { q: "Meu pedido está atrasado, o que faço?", a: "Entre em contato conosco pelo WhatsApp ou email. Teremos prazer em ajudar!" },
  { q: "Como adiciono um cartão de pagamento?", a: "Acesse 'Meu Perfil' → 'Formas de pagamento' e toque em 'Adicionar cartão'." },
];

export default function Help() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!form.name || !form.email || !form.message) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    toast.success("Mensagem enviada! Responderemos em até 24h.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold">Ajuda & Suporte</h1>
      </div>

      {/* Contato rápido */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <a
          href="https://wa.me/5585999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-card hover:shadow-elevated transition-shadow"
        >
          <Phone className="w-6 h-6" />
          <span className="font-bold text-sm">WhatsApp</span>
          <span className="text-xs opacity-80">(85) 9 9999-9999</span>
        </a>
        <a
          href="mailto:suporte@vendymais.com.br"
          className="bg-primary text-primary-foreground rounded-2xl p-4 flex flex-col items-center gap-2 shadow-card hover:shadow-elevated transition-shadow"
        >
          <Mail className="w-6 h-6" />
          <span className="font-bold text-sm">Email</span>
          <span className="text-xs opacity-80">suporte@vendymais.com</span>
        </a>
      </div>

      {/* Horário de atendimento */}
      <div className="bg-card rounded-2xl shadow-card p-4 mb-6 flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Horário de atendimento</p>
          <p className="text-xs text-muted-foreground mt-0.5">Segunda a Sexta: 8h – 20h</p>
          <p className="text-xs text-muted-foreground">Sábados: 9h – 17h</p>
          <p className="text-xs text-muted-foreground">Domingos e feriados: 10h – 14h</p>
        </div>
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
                ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
            {openFaq === i && (
              <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            )}
          </div>
        ))}
      </div>

      {/* Formulário de contato */}
      <h2 className="font-extrabold text-base mb-3">Enviar mensagem</h2>
      <div className="bg-card rounded-2xl shadow-card p-5 space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted-foreground">Seu nome</span>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Como podemos te chamar?"
            className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted-foreground">Email para resposta</span>
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="seu@email.com"
            type="email"
            className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted-foreground">Mensagem</span>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Descreva sua dúvida ou problema..."
            rows={4}
            className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </label>
        <button
          onClick={sendMessage}
          disabled={sending}
          className="w-full py-3.5 rounded-xl gradient-brand text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {sending ? "Enviando..." : <><Send className="w-4 h-4" /> Enviar mensagem</>}
        </button>
      </div>
    </div>
  );
}
