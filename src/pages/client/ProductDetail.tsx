import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, Heart, Share2, Star, Shield, Truck } from "lucide-react";
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
            onClick={() => navigate(`/cliente/loja/${store.id}`)}
            className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left hover:shadow-elevated transition-shadow"
          >
            <img src={store.image} alt={store.name} className="size-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Vendido por</p>
              <p className="text-sm font-bold truncate">{store.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold flex items-center gap-1 justify-end">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" /> {store.rating}
              </p>
              <p className="text-[10px] text-muted-foreground">{store.reviews} avaliações</p>
            </div>
          </button>

          {/* Benefits */}
          <div className="bg-card rounded-2xl p-4 shadow-card space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-4 h-4 text-success" />
              <span><span className="font-semibold">Entrega rápida</span> · {store.deliveryTime} · {store.distance}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span><span className="font-semibold">Compra segura</span> · garantia da plataforma</span>
            </div>
          </div>

          {/* Quantity + actions */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
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
              <button
                onClick={() => add(product)}
                className="flex-1 border-2 border-primary text-primary rounded-xl py-3 font-bold hover:bg-primary/5 transition-colors"
              >
                Adicionar ao carrinho
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 gradient-brand text-primary-foreground rounded-xl py-3 font-bold shadow-card hover:shadow-elevated transition-shadow"
              >
                Comprar agora
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
