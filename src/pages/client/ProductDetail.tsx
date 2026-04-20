import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, Heart } from "lucide-react";
import { products, stores } from "@/data/mockData";
import { TopBar } from "@/components/TopBar";
import { useCart } from "@/context/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const product = products.find((p) => p.id === id);
  const store = product ? stores.find((s) => s.id === product.storeId) : null;

  if (!product || !store) return <div className="p-8">Produto não encontrado.</div>;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) add(product);
    navigate("/cliente/carrinho");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title=""
        right={
          <button className="size-9 rounded-full bg-muted flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="aspect-square gradient-warm flex items-center justify-center text-[10rem]">
          {product.emoji}
        </div>
        <div className="px-5 py-5">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">{store.name}</p>
          <h1 className="text-2xl font-extrabold mt-1">{product.name}</h1>
          <p className="text-3xl font-extrabold text-primary mt-3">R$ {product.price.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6 flex items-center justify-between">
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
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border bg-background">
        <button
          onClick={handleAdd}
          className="w-full gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
        >
          <span>Adicionar ao carrinho</span>
          <span>R$ {(product.price * qty).toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
