import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, Heart, Share2, Star, Shield, Truck, MessageCircle, UserRound, MapPin, Handshake } from "lucide-react";
import { getProductSeller, products } from "@/data/mockData";
import { FulfillmentType, useCart } from "@/context/CartContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
  const [meetupPlace, setMeetupPlace] = useState("");

  const product = products.find((p) => p.id === id);
  const seller = product ? getProductSeller(product) : null;

  if (!product || !seller) return <div className="p-8">Produto não encontrado.</div>;

  const off = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) add(product, fulfillmentType);
    navigate("/cliente/carrinho");
  };

  const fulfillmentOptions = [
    { id: "delivery" as const, label: "Entrega", desc: seller.type === "store" ? "Receba no endereço informado" : "Combine o envio com o vendedor", icon: Truck },
    { id: "pickup" as const, label: "Retirada", desc: seller.type === "store" ? "Retire na loja oficial" : "Retire com o vendedor", icon: MapPin },
    ...(seller.type === "individual" && product.price >= 50
      ? [{ id: "public_meetup" as const, label: "Encontro em local público", desc: "Combine um local seguro pelo chat", icon: Handshake }]
      : []),
  ];

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-card rounded-2xl shadow-card overflow-hidden aspect-square">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            {off > 0 && (
              <span className="inline-block bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-md mb-3">
                OFERTA -{off}%
              </span>
            )}
            <h1 className="text-2xl lg:text-3xl font-extrabold leading-snug">{product.name}</h1>

            <div className="flex items-baseline gap-3 mt-4">
              {product.originalPrice && (
                <span className="text-base text-muted-foreground line-through">R$ {product.originalPrice.toFixed(2)}</span>
              )}
              <span className="text-4xl font-extrabold text-primary">R$ {product.price.toFixed(2)}</span>
            </div>
            <p className="text-sm text-success font-semibold mt-1">em até 3x sem juros</p>
          </div>

          {/* Seller */}
          <button
            onClick={() => seller.type === "store" ? navigate(`/cliente/loja/${seller.id}`) : navigate(`/cliente/chat/${product.id}`)}
            className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left hover:shadow-elevated transition-shadow"
          >
            {seller.type === "store" ? (
              <img src={seller.image} alt={seller.name} className="size-12 rounded-lg object-cover" />
            ) : (
              <div className="size-12 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-extrabold">
                {seller.avatar}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{seller.type === "store" ? "Loja oficial" : "Vendedor comum"}</p>
              <p className="text-sm font-bold truncate">{seller.name}</p>
              {seller.verified ? <VerifiedBadge compact className="mt-1" /> : <span className="inline-flex mt-1 text-[10px] font-bold text-muted-foreground">Sem selo de verificação</span>}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold flex items-center gap-1 justify-end">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" /> {seller.rating}
              </p>
              <p className="text-[10px] text-muted-foreground">{seller.reviews} avaliações</p>
            </div>
          </button>

          {/* Benefits */}
          <div className="bg-card rounded-2xl p-4 shadow-card space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              {seller.type === "store" ? <Truck className="w-4 h-4 text-success" /> : <UserRound className="w-4 h-4 text-primary" />}
              <span><span className="font-semibold">{seller.type === "store" ? "Entrega rápida" : "Contato direto"}</span> · {seller.responseTime} · {seller.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span><span className="font-semibold">Transparência</span> · {seller.description}</span>
            </div>
          </div>

          {/* Quantity + actions */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="mb-4">
              <span className="text-sm font-semibold">Como deseja receber?</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {fulfillmentOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFulfillmentType(option.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      fulfillmentType === option.id ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <option.icon className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-extrabold">{option.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{option.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {seller.type === "individual" && product.price < 50 && (
                <p className="text-[11px] text-muted-foreground mt-2">Encontro em local público fica disponível para produtos a partir de R$ 50,00.</p>
              )}
              {fulfillmentType === "public_meetup" && (
                <div className="mt-3 space-y-2">
                  <input
                    value={meetupPlace}
                    onChange={(e) => setMeetupPlace(e.target.value)}
                    placeholder="Sugira um local público, se quiser"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-[11px] text-muted-foreground">O local e horário devem ser combinados entre comprador e vendedor via chat.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Quantidade</span>
              <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-9 rounded-full bg-background flex items-center justify-center shadow-card">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-6 text-center">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="size-9 rounded-full gradient-brand text-primary-foreground flex items-center justify-center shadow-card">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {seller.type === "store" ? (
                <button
                  onClick={() => add(product, fulfillmentType)}
                  className="flex-1 border-2 border-primary text-primary rounded-xl py-3 font-bold hover:bg-primary/5 transition-colors"
                >
                  Adicionar ao carrinho
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/cliente/chat/${product.id}`, { state: { fulfillmentType, meetupPlace } })}
                  className="flex-1 border-2 border-primary text-primary rounded-xl py-3 font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Conversar
                </button>
              )}
              <button
                onClick={seller.type === "store" ? handleAdd : () => navigate(`/cliente/chat/${product.id}`, { state: { fulfillmentType, meetupPlace } })}
                className="flex-1 gradient-brand text-primary-foreground rounded-xl py-3 font-bold shadow-card hover:shadow-elevated transition-shadow"
              >
                {seller.type === "store" ? "Comprar agora" : "Fazer proposta"}
              </button>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button className="size-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70" aria-label="Compartilhar">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="size-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70" aria-label="Favoritar">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold mb-2">Descrição</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
