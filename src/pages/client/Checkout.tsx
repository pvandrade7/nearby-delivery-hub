import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Banknote, QrCode, Check } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useCart } from "@/context/CartContext";

type Payment = "pix" | "credit" | "cash";

const Checkout = () => {
  const { subtotal, items, clear } = useCart();
  const [address, setAddress] = useState("Rua das Flores, 200 — Apto 42");
  const [payment, setPayment] = useState<Payment>("pix");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const deliveryFee = subtotal > 50 ? 0 : 6.9;
  const total = subtotal + deliveryFee;

  const confirm = () => {
    setLoading(true);
    setTimeout(() => {
      clear();
      navigate("/cliente/confirmacao");
    }, 900);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Checkout" />
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-5">
        {/* Address */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Entregar em</h2>
          <div className="bg-card rounded-2xl p-3 shadow-card flex items-center gap-3">
            <div className="size-10 rounded-xl bg-accent flex items-center justify-center text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </div>
        </section>

        {/* Payment */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Forma de pagamento</h2>
          <div className="space-y-2">
            {[
              { id: "pix", icon: QrCode, label: "Pix", desc: "Aprovação instantânea" },
              { id: "credit", icon: CreditCard, label: "Cartão de crédito", desc: "Visa •••• 4242" },
              { id: "cash", icon: Banknote, label: "Dinheiro na entrega", desc: "Troco para R$ 100" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPayment(p.id as Payment)}
                className={`w-full bg-card rounded-2xl p-3 shadow-card flex items-center gap-3 border-2 transition-all ${
                  payment === p.id ? "border-primary" : "border-transparent"
                }`}
              >
                <div className="size-10 rounded-xl bg-accent flex items-center justify-center text-primary">
                  <p.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                </div>
                {payment === p.id && (
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className="bg-card rounded-2xl p-4 shadow-card text-sm space-y-2">
          <h2 className="font-bold text-base mb-2">Resumo do pedido</h2>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-muted-foreground">
              <span>{i.quantity}x {i.name}</span>
              <span>R$ {(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>{deliveryFee === 0 ? "Grátis" : `R$ ${deliveryFee.toFixed(2)}`}</span></div>
            <div className="flex justify-between font-extrabold text-base pt-1">
              <span>Total</span><span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="px-5 py-4 border-t border-border bg-background">
        <button
          onClick={confirm}
          disabled={loading}
          className="w-full gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {loading ? "Confirmando..." : `Confirmar pedido • R$ ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
