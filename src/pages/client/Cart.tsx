import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { stores } from "@/data/mockData";

const Cart = () => {
  const { items, setQty, remove, subtotal, storeId, count } = useCart();
  const navigate = useNavigate();
  const store = stores.find((s) => s.id === storeId);
  const deliveryFee = subtotal > 50 ? 0 : 6.9;
  const total = subtotal + deliveryFee;

  if (count === 0) {
    return (
      <div className="px-4 lg:px-8 py-20 max-w-md mx-auto text-center">
        <span className="text-6xl mb-4 inline-block">🛒</span>
        <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
        <p className="text-sm text-muted-foreground mt-1">Que tal explorar as lojas pertinho?</p>
        <button onClick={() => navigate("/cliente")} className="mt-6 gradient-brand text-primary-foreground rounded-xl px-6 py-3 font-bold shadow-card">
          Ver lojas
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Seu carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {store && (
            <div className="bg-accent rounded-2xl p-3 flex items-center gap-3">
              <img src={store.image} alt="" className="size-10 rounded-lg object-cover" />
              <div>
                <p className="text-xs text-muted-foreground">Pedindo de</p>
                <p className="text-sm font-bold">{store.name}</p>
              </div>
            </div>
          )}

          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <img src={item.image} alt={item.name} loading="lazy" className="size-16 rounded-xl object-cover bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                <p className="text-base font-extrabold text-primary mt-1">R$ {(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(item.id, item.quantity - 1)} className="size-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                  {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
                <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                <button onClick={() => setQty(item.id, item.quantity + 1)} className="size-8 rounded-full gradient-brand text-primary-foreground flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-card rounded-2xl p-5 shadow-card space-y-3 text-sm">
            <h2 className="font-bold text-base">Resumo</h2>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              <span className={deliveryFee === 0 ? "text-success font-semibold" : ""}>
                {deliveryFee === 0 ? "Grátis 🎉" : `R$ ${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-extrabold text-base">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate("/cliente/checkout")}
              className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow mt-2"
            >
              Continuar para o pagamento
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
