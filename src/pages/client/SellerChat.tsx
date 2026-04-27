import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Send, ShieldCheck, UserRound } from "lucide-react";
import { getProductSeller, products } from "@/data/mockData";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FulfillmentType } from "@/context/CartContext";

const fulfillmentLabel: Record<FulfillmentType, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  public_meetup: "Encontro em local público",
};

const SellerChat = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const chatState = location.state as { fulfillmentType?: FulfillmentType; meetupPlace?: string } | null;
  const [message, setMessage] = useState("");
  const product = products.find((p) => p.id === productId);
  const seller = product ? getProductSeller(product) : null;

  const messages = useMemo(
    () => [
      { from: "buyer", text: `Olá, tenho interesse em ${product?.name ?? "este produto"}. Ainda está disponível?` },
      ...(chatState?.fulfillmentType
        ? [{ from: "buyer", text: `Quero combinar: ${fulfillmentLabel[chatState.fulfillmentType]}${chatState.meetupPlace ? ` em ${chatState.meetupPlace}` : ""}.` }]
        : []),
      { from: "seller", text: "Olá! Está disponível sim. Podemos combinar os detalhes por aqui." },
    ],
    [chatState?.fulfillmentType, chatState?.meetupPlace, product?.name]
  );

  if (!product || !seller) return <div className="p-8">Conversa não encontrada.</div>;

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
            <p className="text-xs text-muted-foreground">Contato direto para tirar dúvidas, negociar e combinar detalhes.</p>
          </div>

          <div className="flex-1 p-5 space-y-4 bg-muted/30">
            {messages.map((item, index) => (
              <div key={index} className={`flex ${item.from === "buyer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-card ${item.from === "buyer" ? "gradient-brand text-primary-foreground" : "bg-background"}`}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva uma mensagem"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button className="size-12 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center shadow-card" aria-label="Enviar mensagem">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerChat;