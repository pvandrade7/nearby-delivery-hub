import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
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
      <div className="flex-1 flex flex-col">
        <TopBar title="Carrinho" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <span className="text-6xl mb-4">🛒</span>
          <h2 className="text-lg font-bold">Seu carrinho está vazio</h2>
          <p className="text-sm text-muted-foreground mt-1">Que tal explorar as lojas pertinho?</p>
          <button onClick={() => navigate("/cliente")} className="mt-6 gradient-brand text-primary-foreground rounded-2xl px-6 py-3 font-bold shadow-card">
            Ver lojas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Seu carrinho" />
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
        {store && (
          <div className="bg-accent rounded-2xl p-3 mb-4 flex items-center gap-3">
            <img src={store.image} alt="" className="size-10 rounded-lg object-cover" />
            <div>
              <p className="text-xs text-muted-foreground">Pedindo de</p>
              <p className="text-sm font-bold">{store.name}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl p-3 shadow-card flex items-center gap-3">
              <img src={item.image} alt={item.name} loading="lazy" width={56} height={56} className="size-14 rounded-xl object-cover bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                <p className="text-sm font-extrabold text-primary mt-0.5">R$ {(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(item.id, item.quantity - 1)} className="size-7 rounded-full bg-muted flex items-center justify-center">
                  {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3" />}
                </button>
                <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                <button onClick={() => setQty(item.id, item.quantity + 1)} className="size-7 rounded-full gradient-brand text-primary-foreground flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-4 mt-5 shadow-card space-y-2 text-sm">
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
          <div className="border-t border-border pt-2 flex justify-between font-extrabold text-base">
            <span>Total</span>
            <span className="text-primary">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border bg-background">
        <button
          onClick={() => navigate("/cliente/checkout")}
          className="w-full gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated active:scale-[0.98] transition-transform"
        >
          Continuar para o pagamento
        </button>
      </div>
    </div>
  );
};

export default Cart;
