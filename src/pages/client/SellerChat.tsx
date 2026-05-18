import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Send, ShieldCheck, UserRound } from "lucide-react";
import { getProductSeller, products } from "@/data/mockData";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FulfillmentType } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const fulfillmentLabel: Record<FulfillmentType, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  public_meetup: "Encontro em local público",
};

type Msg = { id: string; sender_id: string; content: string; created_at: string };

const SellerChat = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const chatState = location.state as { fulfillmentType?: FulfillmentType; meetupPlace?: string } | null;

  const product = products.find((p) => p.id === productId);
  const seller = product ? getProductSeller(product) : null;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Require auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: `/cliente/chat/${productId}` } });
    }
  }, [authLoading, user, navigate, productId]);

  // Find or create conversation
  useEffect(() => {
    if (!user || !product) return;
    let cancelled = false;
    (async () => {
      setLoadingChat(true);
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("product_id", product.id)
        .eq("buyer_id", user.id)
        .maybeSingle();
      let convId = existing?.id ?? null;
      if (!convId) {
        const { data: created, error } = await supabase
          .from("conversations")
          .insert({
            product_id: product.id,
            product_name: product.name,
            product_image: product.image,
            buyer_id: user.id,
            seller_ref: seller?.id ?? null,
          })
          .select("id")
          .single();
        if (error) {
          toast.error("Não foi possível abrir a conversa");
          setLoadingChat(false);
          return;
        }
        convId = created.id;
      }
      if (cancelled) return;
      setConversationId(convId);

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setMessages(msgs ?? []);
      setLoadingChat(false);

      // Mark unread as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .is("read_at", null);
    })();
    return () => { cancelled = true; };
  }, [user, product, seller?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const initialNote = useMemo(() => {
    if (!chatState?.fulfillmentType) return null;
    return `Quero combinar: ${fulfillmentLabel[chatState.fulfillmentType]}${chatState.meetupPlace ? ` em ${chatState.meetupPlace}` : ""}.`;
  }, [chatState?.fulfillmentType, chatState?.meetupPlace]);

  // Send the fulfillment intro once when conversation opens (only if first time + state present)
  useEffect(() => {
    if (!conversationId || !user || !initialNote || messages.length > 0) return;
    void send(initialNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, initialNote, messages.length]);

  const send = async (raw?: string) => {
    const body = (raw ?? text).trim();
    if (!body || !conversationId || !user || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: body,
    });
    if (error) {
      toast.error("Falha ao enviar");
      setText(body);
    }
    setSending(false);
  };

  if (!product || !seller) return <div className="p-8">Conversa não encontrada.</div>;
  if (authLoading || !user) return <div className="p-8">Carregando…</div>;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <aside className="bg-card rounded-2xl shadow-card p-5 h-fit">
          <div className="flex items-center gap-3">
            {seller.type === "store" ? (
              <img src={seller.image} alt={seller.name} className="size-14 rounded-xl object-cover" />
            ) : (
              <div className="size-14 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-extrabold">
                {seller.avatar}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{seller.type === "store" ? "Loja oficial" : "Vendedor comum"}</p>
              <h1 className="font-extrabold truncate">{seller.name}</h1>
              {seller.verified ? <VerifiedBadge compact className="mt-1" /> : <span className="text-[11px] font-bold text-muted-foreground">Sem selo de verificação</span>}
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5" />
              <span>{seller.accountInfo}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <UserRound className="w-4 h-4 text-primary mt-0.5" />
              <span>{seller.responseTime} · {seller.location}</span>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4 flex gap-3">
            <img src={product.image} alt={product.name} className="size-16 rounded-xl object-cover bg-muted" />
            <div className="min-w-0">
              <p className="text-sm font-bold line-clamp-2">{product.name}</p>
              <p className="text-lg font-extrabold text-primary mt-1">R$ {product.price.toFixed(2)}</p>
            </div>
          </div>
          {chatState?.fulfillmentType === "public_meetup" && (
            <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="font-extrabold">Encontro em local público</p>
                  <p className="text-xs text-muted-foreground mt-1">Comprador e vendedor devem combinar local e horário por acordo entre as partes.</p>
                  {chatState.meetupPlace && <p className="text-xs font-semibold mt-2">Sugestão: {chatState.meetupPlace}</p>}
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="bg-card rounded-2xl shadow-card overflow-hidden min-h-[560px] flex flex-col">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-extrabold">Chat com o vendedor</p>
            <p className="text-xs text-muted-foreground">Mensagens em tempo real · histórico salvo automaticamente</p>
          </div>

          <div ref={scrollRef} className="flex-1 p-5 space-y-3 bg-muted/30 overflow-y-auto max-h-[60vh]">
            {loadingChat && <p className="text-center text-xs text-muted-foreground">Carregando histórico…</p>}
            {!loadingChat && messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
            )}
            {messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-card ${mine ? "gradient-brand text-primary-foreground" : "bg-background"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void send(); }}
            className="p-4 border-t border-border flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva uma mensagem"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="size-12 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center shadow-card disabled:opacity-50"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SellerChat;
