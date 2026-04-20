import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, Heart, Share2, ChevronLeft, Star, Shield, Truck } from "lucide-react";
import { products, stores } from "@/data/mockData";
import { useCart } from "@/context/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const product = products.find((p) => p.id === id);
  const store = product ? stores.find((s) => s.id === product.storeId) : null;

  if (!product || !store) return <div className="p-8">Produto não encontrado.</div>;

  const off = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) add(product);
    navigate("/cliente/carrinho");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Top floating bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-card">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <button className="size-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-card">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="size-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-card">
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Image */}
        <div className="aspect-square bg-card flex items-center justify-center">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="px-5 py-4 bg-card">
          {off > 0 && (
            <span className="inline-block bg-secondary text-secondary-foreground text-[11px] font-bold px-2 py-0.5 rounded-md mb-2">
              OFERTA -{off}%
            </span>
          )}
          <h1 className="text-xl font-extrabold leading-snug">{product.name}</h1>

          <div className="flex items-baseline gap-2 mt-3">
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">R$ {product.originalPrice.toFixed(2)}</span>
            )}
            <span className="text-3xl font-extrabold text-primary">R$ {product.price.toFixed(2)}</span>
          </div>
          <p className="text-xs text-success font-semibold mt-1">em até 3x sem juros</p>
        </div>

        {/* Seller */}
        <button
          onClick={() => navigate(`/cliente/loja/${store.id}`)}
          className="mt-2 w-full bg-card px-5 py-3 flex items-center gap-3 text-left active:bg-muted transition-colors"
        >
          <img src={store.image} alt={store.name} loading="lazy" width={40} height={40} className="size-10 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">Vendido por</p>
            <p className="text-sm font-bold truncate">{store.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold flex items-center gap-0.5 justify-end">
              <Star className="w-3 h-3 fill-warning text-warning" /> {store.rating}
            </p>
            <p className="text-[10px] text-muted-foreground">{store.reviews} avaliações</p>
          </div>
        </button>

        {/* Benefits */}
        <div className="mt-2 bg-card px-5 py-3 space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <Truck className="w-4 h-4 text-success" />
            <span><span className="font-semibold">Entrega rápida</span> · {store.deliveryTime} · {store.distance}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Shield className="w-4 h-4 text-primary" />
            <span><span className="font-semibold">Compra segura</span> · garantia da plataforma</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-2 bg-card px-5 py-4">
          <h2 className="text-sm font-bold mb-2">Descrição</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
        </div>

        {/* Quantity */}
        <div className="mt-2 bg-card px-5 py-4 flex items-center justify-between">
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

        <div className="h-4" />
      </div>

      {/* Bottom CTA */}
      <div className="px-5 py-4 border-t border-border bg-background flex gap-3">
        <button
          onClick={() => { add(product); }}
          className="flex-1 border-2 border-primary text-primary rounded-2xl py-3.5 font-bold active:scale-[0.98] transition-transform"
        >
          Adicionar
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 gradient-brand text-primary-foreground rounded-2xl py-3.5 font-bold shadow-elevated active:scale-[0.98] transition-transform"
        >
          Comprar agora
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
