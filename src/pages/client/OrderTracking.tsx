import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Package, Bike, Home as HomeIcon, MessageCircle, Phone, X, Send } from "lucide-react";
import { ORDERS_KEY, type FakeOrder } from "./Checkout";
import { toast } from "sonner";

/* ── passos do status ───────────────────────────────── */
const STEPS = [
  { icon: Check,    label: "Pedido confirmado", desc: "Pagamento aprovado" },
  { icon: Package,  label: "Em preparação",     desc: "A loja está separando seu pedido" },
  { icon: Bike,     label: "Saiu para entrega", desc: "Entregador a caminho" },
  { icon: HomeIcon, label: "Entregue",           desc: "Pedido recebido com sucesso!" },
];

/* ── rota no SVG (grid de ruas fictícias) ───────────── */
//  começa na loja (canto inferior-direito) → chega em casa (canto superior-esquerdo)
const ROUTE = "M 360 235 L 290 235 L 290 195 L 220 195 L 220 140 L 150 140 L 150 80 L 90 80 L 90 40 L 45 40";

/* ── mapa de cidade fake ────────────────────────────── */
const CityMap = () => (
  <>
    {/* fundo de asfalto */}
    <rect width="400" height="270" fill="#d1d5db" />

    {/* quarteirões */}
    {[
      // linha superior
      { x: 0,   y: 0,   w: 80,  h: 32 }, { x: 98,  y: 0,  w: 114, h: 32 },
      { x: 220, y: 0,   w: 62,  h: 32 }, { x: 290, y: 0,  w: 110, h: 32 },
      // linha 2
      { x: 0,   y: 48,  w: 80,  h: 84 }, { x: 98,  y: 48, w: 114, h: 84 },
      { x: 220, y: 48,  w: 62,  h: 84 }, { x: 290, y: 48, w: 110, h: 84 },
      // linha 3
      { x: 0,   y: 148, w: 80,  h: 39 }, { x: 98,  y: 148,w: 114, h: 39 },
      { x: 220, y: 148, w: 62,  h: 39 }, { x: 290, y: 148,w: 110, h: 39 },
      // linha 4
      { x: 0,   y: 205, w: 80,  h: 65 }, { x: 98,  y: 205,w: 114, h: 65 },
      { x: 220, y: 205, w: 62,  h: 65 }, { x: 290, y: 205,w: 110, h: 65 },
    ].map((b, i) => (
      <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
        fill={i % 3 === 0 ? "#e5e7eb" : i % 3 === 1 ? "#f3f4f6" : "#ede9fe"}
        rx="2" />
    ))}

    {/* faixas de pedestre (decoração) */}
    {[0, 8, 16, 24, 32, 40].map((x, i) => (
      <rect key={i} x={88 + x} y={196} width="4" height="8" fill="white" opacity="0.7" rx="1" />
    ))}

    {/* setas de direção nas ruas */}
    <text x="162" y="130" fontSize="10" fill="#9ca3af" textAnchor="middle" transform="rotate(-90, 162, 130)">▲</text>
    <text x="162" y="105" fontSize="10" fill="#9ca3af" textAnchor="middle" transform="rotate(-90, 162, 105)">▲</text>

    {/* labels de rua (decoração) */}
    <text x="162" y="172" fontSize="7" fill="#6b7280" textAnchor="middle" fontWeight="bold">RUA DAS FLORES</text>
    <text x="258" y="220" fontSize="7" fill="#6b7280" textAnchor="middle" fontWeight="bold">AV. CENTRAL</text>
  </>
);

/* ── dados do entregador (demo) ─────────────────────── */
const COURIER = {
  name: "Carlos Mendes",
  phone: "+55 11 98888-7777",
  vehicle: "Honda Biz 125",
  rating: "4.9",
  initial: "C",
};

/* ── modal de chat com o entregador ─────────────────── */
type ChatMessage = { from: "me" | "courier"; text: string; time: string };

const CourierChat = ({ onClose }: { onClose: () => void }) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "courier", text: "Oi! Estou a caminho. Precisa de algo?", time: "agora" },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { from: "me", text: t, time: now }]);
    setText("");
    // Resposta automática do entregador após 1.5s
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "courier", text: "Ok! Já estou chegando. 🛵", time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }, 1500);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="size-10 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-bold shrink-0">
            {COURIER.initial}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{COURIER.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-500 inline-block" /> Online
            </p>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === "me"
                  ? "gradient-brand text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                <p>{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.from === "me" ? "text-white/70" : "text-muted-foreground"}`}>{m.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Mensagem para o entregador..."
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="size-10 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
const OrderTracking = () => {
  const { id } = useParams();
  const [active, setActive] = useState(1);
  const [order, setOrder] = useState<FakeOrder | null>(null);
  const [showChat, setShowChat] = useState(false);

  /* carrega pedido do localStorage */
  useEffect(() => {
    try {
      const list: FakeOrder[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      const found = list.find((o) => o.id === id);
      if (found) {
        setOrder(found);
        const statusMap: Record<string, number> = {
          aprovado: 0, preparando: 1, saiu: 2, entregue: 3,
        };
        setActive(statusMap[found.status] ?? 1);
      }
    } catch { /* silent */ }
  }, [id]);

  /* avança status automaticamente (demo) */
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a < 3 ? a + 1 : a)), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">Rastrear pedido</h1>
      {order && (
        <p className="text-sm text-muted-foreground mb-6">
          Pedido #{order.id} · {order.storeName}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Mapa animado ───────────────────────────── */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="relative w-full" style={{ paddingBottom: "67.5%" }}>
            <svg
              viewBox="0 0 400 270"
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* cidade */}
              <CityMap />

              {/* sombra da rota */}
              <path
                d={ROUTE}
                fill="none"
                stroke="white"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              />

              {/* rota principal */}
              <path
                id="moto-route"
                d={ROUTE}
                fill="none"
                stroke="#f97316"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="10 6"
              />

              {/* ── Marcador LOJA (origem) ── */}
              <g transform="translate(360, 235)">
                {/* anel pulsando */}
                <circle r="14" fill="#f97316" opacity="0.15">
                  <animate attributeName="r"       values="14;22;14" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0;0.15" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle r="12" fill="#f97316" stroke="white" strokeWidth="2.5" />
                <text textAnchor="middle" dominantBaseline="middle" fontSize="12">🏪</text>
              </g>

              {/* label loja */}
              <rect x="325" y="248" width="30" height="12" rx="3" fill="white" opacity="0.85" />
              <text x="340" y="257" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">LOJA</text>

              {/* ── Marcador CASA (destino) ── */}
              <g transform="translate(45, 40)">
                <circle r="14" fill="#22c55e" opacity="0.15">
                  <animate attributeName="r"       values="14;22;14" dur="1.9s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0;0.15" dur="1.9s" repeatCount="indefinite" />
                </circle>
                <circle r="12" fill="#22c55e" stroke="white" strokeWidth="2.5" />
                <text textAnchor="middle" dominantBaseline="middle" fontSize="12">🏠</text>
              </g>

              {/* label casa */}
              <rect x="10" y="57" width="30" height="12" rx="3" fill="white" opacity="0.85" />
              <text x="25" y="66" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">VOCÊ</text>

              {/* ── Motoboy animado: aparece apenas quando saiu para entrega ── */}
              {active >= 2 && active < 3 && (
                <g style={{ animation: "fadeIn 0.8s ease" }}>
                  <animateMotion
                    dur="9s"
                    repeatCount="indefinite"
                    calcMode="linear"
                  >
                    <mpath href="#moto-route" />
                  </animateMotion>

                  {/* glow externo */}
                  <circle r="18" fill="#f97316" opacity="0.15">
                    <animate attributeName="r"       values="18;24;18" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1.4s" repeatCount="indefinite" />
                  </circle>

                  {/* círculo principal */}
                  <circle r="13" fill="#f97316" stroke="white" strokeWidth="2.5" />

                  {/* ícone do motoboy */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="14"
                    style={{ userSelect: "none" }}
                  >
                    🛵
                  </text>
                </g>
              )}

              {/* ── Motoboy parado no destino quando entregue ── */}
              {active >= 3 && (
                <g transform="translate(45, 40)">
                  <circle r="16" fill="#22c55e" opacity="0.2">
                    <animate attributeName="r"       values="16;24;16" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0;0.2"  dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle r="13" fill="#22c55e" stroke="white" strokeWidth="2.5" />
                  <text textAnchor="middle" dominantBaseline="middle" fontSize="14" style={{ userSelect: "none" }}>✅</text>
                </g>
              )}

              {/* pontos de rota (decoração estática) */}
              {[
                [290, 235], [220, 195], [150, 140], [90, 80],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3.5" fill="#f97316" opacity="0.5" />
              ))}
            </svg>

            {/* Badge de distância */}
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-xl px-3 py-2 shadow-card text-xs font-semibold flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              Entregador a 600m
            </div>

            {/* Badge ETA */}
            <div className="absolute top-4 right-4 bg-background/95 backdrop-blur rounded-xl px-3 py-2 shadow-card text-xs font-semibold">
              ⏱ {order ? `${order.estimatedMin}–${order.estimatedMax} min` : "25–40 min"}
            </div>
          </div>
        </div>

        {/* ── Painel lateral ─────────────────────────── */}
        <div className="space-y-4">

          {/* Card do entregador */}
          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className="size-12 rounded-full gradient-brand text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
              {COURIER.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{COURIER.name}</p>
              <p className="text-xs text-muted-foreground">🛵 {COURIER.vehicle} · ⭐ {COURIER.rating}</p>
            </div>
            <button
              onClick={() => setShowChat(true)}
              className="size-9 rounded-full bg-accent text-primary flex items-center justify-center hover:bg-accent/70 transition-colors"
              aria-label="Mensagem"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <a
              href={`tel:${COURIER.phone.replace(/\D/g, "").replace(/^55/, "+55")}`}
              onClick={() => toast.success(`Ligando para ${COURIER.name}…`)}
              className="size-9 rounded-full gradient-brand text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              aria-label="Ligar"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Steps de status */}
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="font-bold text-sm mb-4">Status do pedido</h2>
            <div className="space-y-1">
              {STEPS.map((s, i) => {
                const done = i <= active;
                const isCurrent = i === active;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                          done
                            ? "gradient-brand text-primary-foreground shadow-glow"
                            : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "animate-pulse-soft ring-2 ring-primary/30" : ""}`}
                      >
                        <s.icon className="w-4 h-4" />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-1 min-h-[24px] transition-colors duration-700 ${
                            done && i < active ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <p className={`font-bold text-sm transition-colors ${done ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo do pedido (se disponível) */}
          {order && (
            <div className="bg-card rounded-2xl p-4 shadow-card text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-sm text-foreground mb-2">Resumo</p>
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}× {item.name}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-muted-foreground">+{order.items.length - 3} itens</p>
              )}
              <div className="border-t border-border pt-1 mt-1 flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showChat && <CourierChat onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default OrderTracking;
