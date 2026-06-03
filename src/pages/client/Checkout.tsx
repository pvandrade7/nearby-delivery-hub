import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, CreditCard, Banknote, QrCode, Check,
  Store as StoreIcon, Truck, Wallet, ArrowLeft, Copy, Lock, AlertCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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

/* ── localStorage helpers (mantidos para compatibilidade com OrderTracking) ── */
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

/* ── Validação Luhn (cartão de crédito) ──────────────── */
const luhnCheck = (num: string): boolean => {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

/* ── Validação de data de validade ───────────────────── */
const isExpiryValid = (exp: string): boolean => {
  const parts = exp.split("/");
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0], 10);
  const year = parseInt("20" + parts[1], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month, 0);
  return expDate >= now;
};

/* ════════════════════════════════════════════════════ */
const Checkout = () => {
  const { subtotal, items, fulfillmentType, setFulfillmentType, clear, storeId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("summary");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<PayMethod>("pix");
  const [addressError, setAddressError] = useState(false);

  // Cartão
  const [cardNum, setCardNum]       = useState("");
  const [cardName, setCardName]     = useState("");
  const [cardExp, setCardExp]       = useState("");
  const [cardCvv, setCardCvv]       = useState("");
  const [cardErrors, setCardErrors] = useState<Record<string,string>>({});

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* ── animação de processamento ─────────────────────── */
  useEffect(() => {
    if (step !== "processing" || procDone.current) return;
    const delays = [900, 1200, 1000, 900];
    let i = 0;
    const run = async () => {
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
        // Salva no Supabase (pedido real)
        if (user) {
          await supabase.from("orders").insert({
            buyer_id: user.id,
            store_id: storeId,
            store_name: storeName,
            items: items.map((it) => ({ name: it.name, quantity: it.quantity, price: it.price })),
            total,
            address: address || null,
            payment: PAY_OPTS.find((p) => p.id === payment)?.label ?? payment,
            fulfillment: FULFILLMENT_LABELS[fulfillmentType],
            status: "aprovado",
            estimated_min: order.estimatedMin,
            estimated_max: order.estimatedMax,
          });
        }
        // Salva também no localStorage para o rastreamento funcionar offline
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

    // Valida endereço obrigatório em modo delivery
    if (fulfillmentType === "delivery" && !address.trim()) {
      setAddressError(true);
      toast.error("Informe o endereço de entrega antes de continuar");
      return;
    }
    setAddressError(false);

    if (payment === "pix") { setPixCount(120); setStep("pix"); }
    else if (payment === "credit" || payment === "debit") setStep("card");
    else startProcessing();
  };

  const validateCard = (): boolean => {
    const errors: Record<string, string> = {};
    const rawNum = cardNum.replace(/\D/g, "");

    if (rawNum.length < 13) errors.num = "Número inválido";
    else if (!luhnCheck(rawNum)) errors.num = "Número de cartão inválido";

    if (!cardName.trim()) errors.name = "Informe o nome do titular";

    if (!cardExp || cardExp.length < 5) errors.exp = "Informe a validade";
    else if (!isExpiryValid(cardExp)) errors.exp = "Cartão vencido ou data inválida";

    if (!cardCvv || cardCvv.length < 3) errors.cvv = "CVV inválido";

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCardPay = () => {
    if (!validateCard()) {
      toast.error("Corrija os dados do cartão antes de continuar");
      return;
    }
    startProcessing();
  };

  /* ════ TELA DE PROCESSAMENTO ════════════════════════ */
  if (step === "processing") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-8 px-6">
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

          {/* QR Code real */}
          <div className="flex justify-center bg-white rounded-2xl p-4">
            <QRCodeSVG
              value={FAKE_PIX}
              size={176}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={false}
            />
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
                <p className={`font-bold text-sm ${cardErrors.exp ? "text-red-300" : "text-white"}`}>{dispExp}</p>
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
              onChange={(e) => { setCardNum(formatCard(e.target.value)); setCardErrors((p) => ({ ...p, num: "" })); }}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              maxLength={19}
              className={`mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-mono font-semibold focus:outline-none focus:ring-2 ${cardErrors.num ? "ring-2 ring-destructive/60" : "focus:ring-primary/30"}`}
            />
            {cardErrors.num && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{cardErrors.num}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground">Nome do titular</label>
            <input
              value={cardName}
              onChange={(e) => { setCardName(e.target.value.toUpperCase()); setCardErrors((p) => ({ ...p, name: "" })); }}
              placeholder="COMO APARECE NO CARTÃO"
              maxLength={26}
              className={`mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold uppercase focus:outline-none focus:ring-2 ${cardErrors.name ? "ring-2 ring-destructive/60" : "focus:ring-primary/30"}`}
            />
            {cardErrors.name && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{cardErrors.name}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground">Validade</label>
              <input
                value={cardExp}
                onChange={(e) => { setCardExp(formatExpiry(e.target.value)); setCardErrors((p) => ({ ...p, exp: "" })); }}
                placeholder="MM/AA"
                inputMode="numeric"
                maxLength={5}
                className={`mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 ${cardErrors.exp ? "ring-2 ring-destructive/60" : "focus:ring-primary/30"}`}
              />
              {cardErrors.exp && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{cardErrors.exp}</p>}
            </div>
            <div className="w-28">
              <label className="text-xs font-bold text-muted-foreground">CVV</label>
              <input
                value={cardCvv}
                onChange={(e) => { setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); setCardErrors((p) => ({ ...p, cvv: "" })); }}
                placeholder="•••"
                inputMode="numeric"
                type="password"
                maxLength={4}
                className={`mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 ${cardErrors.cvv ? "ring-2 ring-destructive/60" : "focus:ring-primary/30"}`}
              />
              {cardErrors.cvv && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{cardErrors.cvv}</p>}
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
                    onClick={() => { setFulfillmentType(type); setAddressError(false); }}
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
          <section className={`bg-card rounded-2xl p-5 shadow-card border-2 transition-colors ${addressError ? "border-destructive/60" : "border-transparent"}`}>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {fulfillmentType === "delivery" ? "Entregar em" : "Referência de contato"}
            </h2>
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl bg-accent flex items-center justify-center shrink-0 ${addressError ? "text-destructive" : "text-primary"}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <input
                value={address}
                onChange={(e) => { setAddress(e.target.value); if (e.target.value) setAddressError(false); }}
                placeholder={fulfillmentType === "delivery" ? "Informe o endereço de entrega *" : "Referência (opcional)"}
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
              />
            </div>
            {addressError && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Endereço obrigatório para entrega
              </p>
            )}
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
