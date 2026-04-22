import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Banknote, QrCode, Check } from "lucide-react";
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
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Address */}
          <section className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Entregar em</h2>
            <div className="flex items-center gap-3">
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
          <section className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Forma de pagamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "pix", icon: QrCode, label: "Pix", desc: "Aprovação instantânea" },
                { id: "credit", icon: CreditCard, label: "Cartão", desc: "Visa •••• 4242" },
                { id: "cash", icon: Banknote, label: "Dinheiro", desc: "Troco para R$ 100" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id as Payment)}
                  className={`bg-background rounded-2xl p-3 flex flex-col gap-2 border-2 transition-all text-left ${
                    payment === p.id ? "border-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="size-9 rounded-lg bg-accent flex items-center justify-center text-primary">
                      <p.icon className="w-4 h-4" />
                    </div>
                    {payment === p.id && (
                      <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-card rounded-2xl p-5 shadow-card text-sm space-y-2">
            <h2 className="font-bold text-base mb-2">Resumo do pedido</h2>
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-muted-foreground">
                <span className="truncate pr-2">{i.quantity}x {i.name}</span>
                <span className="shrink-0">R$ {(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>{deliveryFee === 0 ? "Grátis" : `R$ ${deliveryFee.toFixed(2)}`}</span></div>
              <div className="flex justify-between font-extrabold text-base pt-1">
                <span>Total</span><span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={confirm}
              disabled={loading}
              className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-70 mt-3"
            >
              {loading ? "Confirmando..." : `Confirmar pedido`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
