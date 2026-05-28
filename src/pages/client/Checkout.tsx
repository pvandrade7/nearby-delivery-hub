import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, CreditCard, Banknote, QrCode, Check,
  Store as StoreIcon, Truck, Wallet, ArrowLeft, Copy, Lock,
} from "lucide-react";
import { FulfillmentType, useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { stores } from "@/data/mockData";

/* ── tipos ─────────────────────────────────────────── */
type Step = "summary" | "card" | "pix" | "processing";
type PayMethod = "pix" | "credit" | "debit" | "cash" | "wallet";

export interface FakeOrder {
  id: string;
  storeName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  address: string;
  payment: string;
  fulfillment: string;
  status: "aprovado" | "preparando" | "saiu" | "entregue";
  createdAt: number;
  estimatedMin: number;
  estimatedMax: number;
}

/* ── localStorage helpers ───────────────────────────── */
export const ORDERS_KEY = "vendy_fake_orders";

export const saveOrder = (o: FakeOrder) => {
  try {
    const prev: FakeOrder[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    localStorage.setItem(ORDERS_KEY, JSON.stringify([o, ...prev]));
  } catch { /* silent */ }
};

/* ── constantes ─────────────────────────────────────── */
const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  public_meetup: "Encontro público",
};

const PAY_OPTS: { id: PayMethod; icon: typeof QrCode; label: string; desc: string }[] = [
  { id: "pix",    icon: QrCode,      label: "Pix",             desc: "Aprovação instantânea" },
  { id: "credit", icon: CreditCard,  label: "Crédito",         desc: "Em até 12x sem juros" },
  { id: "debit",  icon: CreditCard,  label: "Débito",          desc: "Débito na conta" },
  { id: "cash",   icon: Banknote,    label: "Dinheiro",        desc: "Troco disponível" },
  { id: "wallet", icon: Wallet,      label: "Carteira digital", desc: "Saldo: R$ 120,00" },
];

const PROCESSING_MSGS = [
  "Conectando ao banco...",
  "Processando pagamento...",
  "Validando dados...",
  "Confirmando pedido...",
];

const FAKE_PIX =
  "00020126580014BR.GOV.BCB.PIX0136a629532e-7693-4846-b028f142082d7b335204000053039865802BR5913VENDYMAIS6009SAOPAULO62070503***6304EA3F";

const formatCard = (v: string) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
};

/* ── QR Code SVG falso ──────────────────────────────── */
const FakeQR = () => (
  <svg viewBox="0 0 210 210" className="w-44 h-44" xmlns="http://www.w3.org/2000/svg">
    {/* Detectores de posição */}
    {[{x:8,y:8},{x:148,y:8},{x:8,y:148}].map((p,i)=>(
      <g key={i}>
        <rect x={p.x} y={p.y} width="54" height="54" rx="5" fill="none" stroke="currentColor" strokeWidth="6"/>
        <rect x={p.x+14} y={p.y+14} width="26" height="26" rx="2" fill="currentColor"/>
      </g>
    ))}
    {/* Módulos de dados */}
    {[
      [78,8],[88,8],[98,8],[108,8],[118,8],[128,8],[138,8],
      [78,18],[98,18],[118,18],[138,18],
      [88,28],[98,28],[108,28],[128,28],
      [78,38],[108,38],[118,38],[128,38],[138,38],
      [78,48],[88,48],[98,48],[118,48],
      [8,78],[18,78],[28,78],[38,78],[48,78],[58,78],[78,78],[88,78],[108,78],[128,78],[148,78],[158,78],[178,78],[198,78],
      [8,88],[38,88],[58,88],[88,88],[108,88],[138,88],[158,88],[188,88],
      [8,98],[18,98],[28,98],[48,98],[78,98],[108,98],[118,98],[148,98],[168,98],[198,98],
      [8,108],[28,108],[48,108],[58,108],[88,108],[108,108],[138,108],[148,108],[178,108],[198,108],
      [8,118],[18,118],[28,118],[48,118],[78,118],[98,118],[118,118],[148,118],[168,118],[188,118],
      [8,128],[38,128],[58,128],[88,128],[118,128],[148,128],[178,128],
      [68,138],[78,138],[98,138],[128,138],[148,138],[168,138],[188,138],[198,138],
      [68,148],[88,148],[118,148],[138,148],[168,148],
      [78,158],[88,158],[108,158],[128,158],[148,158],[178,158],[188,158],[198,158],
      [68,168],[98,168],[118,168],[138,168],[158,168],[188,168],
      [78,178],[88,178],[128,178],[148,178],[168,178],[198,178],
      [68,198],[88,198],[108,198],[138,198],[158,198],[178,198],[198,198],
    ].map(([x,y],i)=>(
      <rect key={i} x={x} y={y} width="8" height="8" fill="currentColor"/>
    ))}
  </svg>
);

/* ════════════════════════════════════════════════════ */
const Checkout = () => {
  const { subtotal, items, fulfillmentType, setFulfillmentType, clear, storeId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("summary");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<PayMethod>("pix");

  // Cartão
  const [cardNum, setCardNum]       = useState("");
  const [cardName, setCardName]     = useState("");
  const [cardExp, setCardExp]       = useState("");
  const [cardCvv, setCardCvv]       = useState("");

  // PIX
  const [pixCopied, setPixCopied]   = useState(false);
  const [pixCount, setPixCount]     = useState(120);

  // Processamento
  const [procStep, setProcStep]     = useState(0);
  const procDone                    = useRef(false);

  const deliveryFee = fulfillmentType === "delivery" ? (subtotal > 50 ? 0 : 6.9) : 0;
  const total = subtotal + deliveryFee;
  const [orderId] = useState(() => String(Math.floor(1100 + Math.random() * 8900)));

  const storeName =
    stores.find((s) => s.id === storeId)?.name ?? "Loja parceira";

  /* ── carregar endereço ─────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: addr } = await supabase
        .from("addresses").select("street,number,complement")
        .eq("user_id", user.id).eq("is_default", true).maybeSingle();
      if (addr) {
        const line = [addr.street, addr.number].filter(Boolean).join(", ");
        setAddress(`${line}${addr.complement ? ` — ${addr.complement}` : ""}`);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles").select("extras").eq("id", user.id).maybeSingle();
      const ext = prof?.extras as Record<string, string> | null;
      if (ext?.address) setAddress(`${ext.address}${ext.reference ? ` — ${ext.reference}` : ""}`);
    })();
  }, [user]);

  /* ── contagem regressiva do PIX ────────────────────── */
  useEffect(() => {
    if (step !== "pix") return;
    const t = setInterval(() => {
      setPixCount((c) => {
        if (c <= 1) { clearInterval(t); startProcessing(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  /* ── animação de processamento ─────────────────────── */
  useEffect(() => {
    if (step !== "processing" || procDone.current) return;
    const delays = [900, 1200, 1000, 900];
    let i = 0;
    const run = () => {
      if (i >= PROCESSING_MSGS.length) {
        procDone.current = true;
        const order: FakeOrder = {
          id: orderId,
          storeName,
          items: items.map((it) => ({ name: it.name, quantity: it.quantity, price: it.price })),
          total,
          address: address || "Endereço não informado",
          payment: PAY_OPTS.find((p) => p.id === payment)?.label ?? payment,
          fulfillment: FULFILLMENT_LABELS[fulfillmentType],
          status: "aprovado",
          createdAt: Date.now(),
          estimatedMin: fulfillmentType === "delivery" ? 25 : 10,
          estimatedMax: fulfillmentType === "delivery" ? 40 : 20,
        };
        saveOrder(order);
        clear();
        navigate("/cliente/confirmacao", { state: { order }, replace: true });
        return;
      }
      setProcStep(i);
      setTimeout(run, delays[i++]);
    };
    setTimeout(run, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const startProcessing = () => { procDone.current = false; setProcStep(0); setStep("processing"); };

  const handleConfirm = () => {
    if (!items.length) { toast.error("Seu carrinho está vazio"); return; }
    if (payment === "pix") { setPixCount(120); setStep("pix"); }
    else if (payment === "credit" || payment === "debit") setStep("card");
    else startProcessing();
  };

  const handleCardPay = () => {
    if (!cardNum || !cardName || !cardExp || !cardCvv) {
      toast.error("Preencha todos os dados do cartão");
      return;
    }
    startProcessing();
  };

  /* ════ TELA DE PROCESSAMENTO ════════════════════════ */
  if (step === "processing") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-8 px-6">
        {/* Spinner central */}
        <div className="relative size-24">
          <div className="absolute inset-0 rounded-full gradient-brand opacity-20 animate-ping" />
          <div className="size-24 rounded-full gradient-brand flex items-center justify-center shadow-glow">
            <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xl font-extrabold">{PROCESSING_MSGS[procStep]}</p>
          <p className="text-sm text-muted-foreground">Por favor, não feche esta página</p>
        </div>

        {/* Barra de progresso */}
        <div className="flex gap-2">
          {PROCESSING_MSGS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-700 ${
                i <= procStep ? "w-10 bg-primary" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
          <Lock className="w-3 h-3" /> Conexão segura · Dados criptografados
        </p>
      </div>
    );
  }

  /* ════ TELA PIX ════════════════════════════════════ */
  if (step === "pix") {
    const mm = String(Math.floor(pixCount / 60)).padStart(2, "0");
    const ss = String(pixCount % 60).padStart(2, "0");
    return (
      <div className="px-4 py-8 max-w-md mx-auto">
        <button
          onClick={() => setStep("summary")}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-5">
          <div className="text-center">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold">Pague com Pix</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Escaneie o QR Code ou copie o código abaixo
            </p>
          </div>

          {/* QR */}
          <div className="flex justify-center text-foreground/90 bg-muted rounded-2xl p-4">
            <FakeQR />
          </div>

          {/* Código copia-cola */}
          <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
            <p className="flex-1 text-[11px] font-mono text-muted-foreground break-all line-clamp-2">
              {FAKE_PIX}
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(FAKE_PIX).catch(() => {});
                setPixCopied(true);
                toast.success("Código copiado!");
                setTimeout(() => setPixCopied(false), 2000);
              }}
              className="shrink-0 size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Timer */}
          <div className="text-center border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Expira em</p>
            <p className={`text-3xl font-extrabold font-mono ${pixCount < 30 ? "text-destructive" : "text-primary"}`}>
              {mm}:{ss}
            </p>
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-extrabold text-primary">R$ {total.toFixed(2)}</span>
          </div>

          <button
            onClick={startProcessing}
            className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
          >
            Já paguei — confirmar
          </button>
        </div>
      </div>
    );
  }

  /* ════ TELA CARTÃO ══════════════════════════════════ */
  if (step === "card") {
    const dispNum  = cardNum  || "•••• •••• •••• ••••";
    const dispName = cardName || "SEU NOME";
    const dispExp  = cardExp  || "MM/AA";

    return (
      <div className="px-4 py-8 max-w-md mx-auto">
        <button
          onClick={() => setStep("summary")}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Cartão visual */}
        <div className="h-48 gradient-brand rounded-2xl shadow-glow p-6 mb-6 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest">
              {payment === "debit" ? "Débito" : "Crédito"}
            </span>
            <div className="flex gap-1">
              <div className="size-7 rounded-full bg-white/40" />
              <div className="size-7 rounded-full bg-white/25 -ml-3" />
            </div>
          </div>
          <div>
            <p className="text-white font-mono text-lg tracking-widest mb-3">{dispNum}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/50 text-[9px] uppercase tracking-wider">Titular</p>
                <p className="text-white font-bold text-sm uppercase truncate max-w-[160px]">{dispName}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[9px] uppercase tracking-wider">Validade</p>
                <p className="text-white font-bold text-sm">{dispExp}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
          <h2 className="font-extrabold text-lg">Dados do cartão</h2>

          <div>
            <label className="text-xs font-bold text-muted-foreground">Número do cartão</label>
            <input
              value={cardNum}
              onChange={(e) => setCardNum(formatCard(e.target.value))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              maxLength={19}
              className="mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground">Nome do titular</label>
            <input
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              placeholder="COMO APARECE NO CARTÃO"
              maxLength={26}
              className="mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground">Validade</label>
              <input
                value={cardExp}
                onChange={(e) => setCardExp(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                inputMode="numeric"
                maxLength={5}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="w-28">
              <label className="text-xs font-bold text-muted-foreground">CVV</label>
              <input
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="•••"
                inputMode="numeric"
                type="password"
                maxLength={4}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-extrabold text-primary">R$ {total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCardPay}
            className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
          >
            Pagar R$ {total.toFixed(2)}
          </button>

          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" /> Ambiente seguro e criptografado
          </p>
        </div>
      </div>
    );
  }

  /* ════ TELA RESUMO (default) ════════════════════════ */
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Modo de recebimento */}
          <section className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recebimento</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["delivery", "pickup"] as FulfillmentType[]).map((type) => {
                const Icon = type === "delivery" ? Truck : StoreIcon;
                return (
                  <button
                    key={type}
                    onClick={() => setFulfillmentType(type)}
                    className={`rounded-2xl border-2 p-3 text-left transition-all ${
                      fulfillmentType === type
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold">{FULFILLMENT_LABELS[type]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {type === "delivery" ? "Receber no endereço" : "Retirar na loja"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Endereço */}
          <section className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {fulfillmentType === "delivery" ? "Entregar em" : "Referência de contato"}
            </h2>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Informe o endereço de entrega"
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
              />
            </div>
          </section>

          {/* Forma de pagamento */}
          <section className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Forma de pagamento</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAY_OPTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={`rounded-2xl border-2 p-3 flex flex-col gap-2 text-left transition-all ${
                    payment === p.id ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-primary">
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

        {/* Resumo do pedido */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-card rounded-2xl p-5 shadow-card text-sm space-y-2">
            <h2 className="font-bold text-base mb-3">Resumo do pedido</h2>

            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Carrinho vazio</p>
            ) : (
              <>
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate pr-2">{i.quantity}× {i.name}</span>
                    <span className="shrink-0">R$ {(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="border-t border-border pt-3 space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Entrega</span>
                    <span>
                      {fulfillmentType !== "delivery"
                        ? "Não se aplica"
                        : deliveryFee === 0
                          ? <span className="text-primary font-bold">Grátis</span>
                          : `R$ ${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-base pt-1 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleConfirm}
              disabled={items.length === 0}
              className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-50 mt-2"
            >
              {payment === "pix" ? "Gerar QR Code Pix" :
               payment === "credit" || payment === "debit" ? "Informar dados do cartão" :
               "Confirmar pedido"}
            </button>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1 pt-1">
              <Lock className="w-3 h-3" /> Compra protegida pela Vendy+
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
