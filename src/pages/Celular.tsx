import { useEffect, useRef, useState } from "react";
import { Maximize2, RotateCcw, Monitor } from "lucide-react";

/**
 * /celular — exibe a aplicação dentro de uma moldura de smartphone realista.
 *
 * Como usar na apresentação:
 *  1. Acesse localhost:5173/celular
 *  2. Feche o DevTools (F12) para sumir com o painel lateral
 *  3. Pressione F11 para tela cheia
 *  → A tela toda fica com fundo escuro e o celular ao centro
 */

const BASE         = window.location.origin;
const APP_URL      = `${BASE}/`;

// ── Componente da moldura ─────────────────────────────────────────────────────

interface FrameProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  src: string;
  scale: number;
}

const SmartphoneFrame = ({ iframeRef, src, scale }: FrameProps) => (
  <div
    style={{
      transformOrigin: "top center",
      transform: `scale(${scale})`,
      // Compensa o espaço extra gerado pelo scale < 1
      marginBottom: scale < 1 ? `${-(864 * (1 - scale))}px` : 0,
    }}
  >
    {/* ── Corpo externo ──────────────────────────────────────────── */}
    <div
      style={{
        position: "relative",
        width: 428,
        background: "linear-gradient(160deg, #1f1f28 0%, #0c0c10 100%)",
        borderRadius: 56,
        padding: "12px 18px 16px",
        boxShadow: [
          "0 0 0 1px #2d2d3d",
          "0 0 0 2.5px #141418",
          "0 60px 180px rgba(0,0,0,0.95)",
          "inset 0 1px 0 rgba(255,255,255,0.07)",
          "inset 0 -1px 0 rgba(0,0,0,0.5)",
        ].join(", "),
      }}
    >
      {/* Reflexo sutil no topo do frame */}
      <div style={{
        position: "absolute", top: 0, left: "15%", right: "15%",
        height: 2, borderRadius: "0 0 4px 4px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
      }} />

      {/* ── Botões laterais esquerda ──── */}
      {/* Mute */}
      <div style={{ position:"absolute", left:-5, top:108, width:4, height:26,
        borderRadius:"3px 0 0 3px",
        background:"linear-gradient(180deg,#2c2c3c,#1a1a24)",
        boxShadow:"inset 1px 0 0 rgba(255,255,255,0.07),-1px 0 3px rgba(0,0,0,0.7)" }} />
      {/* Vol + */}
      <div style={{ position:"absolute", left:-5, top:166, width:4, height:46,
        borderRadius:"3px 0 0 3px",
        background:"linear-gradient(180deg,#2c2c3c,#1a1a24)",
        boxShadow:"inset 1px 0 0 rgba(255,255,255,0.07),-1px 0 3px rgba(0,0,0,0.7)" }} />
      {/* Vol - */}
      <div style={{ position:"absolute", left:-5, top:226, width:4, height:46,
        borderRadius:"3px 0 0 3px",
        background:"linear-gradient(180deg,#2c2c3c,#1a1a24)",
        boxShadow:"inset 1px 0 0 rgba(255,255,255,0.07),-1px 0 3px rgba(0,0,0,0.7)" }} />

      {/* ── Botão power direita ──────── */}
      <div style={{ position:"absolute", right:-5, top:192, width:4, height:64,
        borderRadius:"0 3px 3px 0",
        background:"linear-gradient(180deg,#2c2c3c,#1a1a24)",
        boxShadow:"inset -1px 0 0 rgba(255,255,255,0.07),1px 0 3px rgba(0,0,0,0.7)" }} />

      {/* ── Tela interna ─────────────────────────────────────────── */}
      <div style={{
        width: 390, height: 844,
        borderRadius: 44,
        overflow: "hidden",
        background: "#000",
        position: "relative",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}>
        {/* Dynamic Island */}
        <div style={{
          position:"absolute", top:12, left:"50%",
          transform:"translateX(-50%)",
          width:124, height:36,
          background:"#000", borderRadius:20,
          zIndex:30,
          boxShadow:"0 0 0 1.5px rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.8)",
        }} />

        {/* Barra de status decorativa */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:54,
          display:"flex", alignItems:"flex-end",
          justifyContent:"space-between",
          padding:"0 28px 8px",
          pointerEvents:"none", zIndex:20,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}>
          <span style={{ color:"#fff", fontSize:13, fontWeight:700, letterSpacing:-0.3 }}>
            9:41
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            {/* Barras de sinal */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="white" opacity={0.9}>
              <rect x="0"  y="8" width="3" height="4" rx="0.8" />
              <rect x="4.5" y="5" width="3" height="7" rx="0.8" />
              <rect x="9"  y="2" width="3" height="10" rx="0.8" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.8" opacity="0.35" />
            </svg>
            {/* Wi-Fi */}
            <svg width="16" height="12" viewBox="0 0 24 18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity={0.9}>
              <path d="M12 14.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="white" stroke="none"/>
              <path d="M5.5 10.5a9.3 9.3 0 0 1 13 0" />
              <path d="M2 7a14 14 0 0 1 20 0" />
            </svg>
            {/* Bateria */}
            <svg width="26" height="12" viewBox="0 0 26 12" opacity={0.9}>
              <rect x="0.6" y="1.5" width="22" height="9" rx="2.5" stroke="white" strokeWidth="1.3" fill="none"/>
              <rect x="1.8" y="2.8" width="17" height="6.4" rx="1.5" fill="white"/>
              <path d="M23.8 4.5v3" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
        </div>

        {/* iframe — começa abaixo da status bar */}
        <iframe
          ref={iframeRef}
          src={src}
          title="Vendy+ Mobile"
          style={{
            position:"absolute", top:54, left:0,
            width:390, height:790,
            border:"none", display:"block",
          }}
          allow="same-origin"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock"
        />

        {/* Home indicator */}
        <div style={{
          position:"absolute", bottom:8, left:"50%",
          transform:"translateX(-50%)",
          width:136, height:5,
          background:"rgba(255,255,255,0.25)", borderRadius:3,
          zIndex:30, pointerEvents:"none",
        }} />
      </div>
    </div>
  </div>
);

// ── Página ────────────────────────────────────────────────────────────────────

const Celular = () => {
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [src,   setSrc]   = useState(APP_URL);

  // Escala dinâmica: ajusta a moldura para caber na janela atual
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const FRAME_W = 450;   // largura total com botões laterais
      const FRAME_H = 900;   // altura total da moldura
      const scaleH  = (vh - 24) / FRAME_H;
      const scaleW  = (vw - 24) / FRAME_W;
      setScale(Math.min(1, scaleH, scaleW));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const reload = () => setSrc(`${APP_URL}&_=${Date.now()}`);

  const openPopup = () => {
    window.open(
      `${BASE}/celular`,
      "vendy_celular",
      "width=460,height=940,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=1"
    );
  };

  const openDesktop = () => {
    window.open(`${BASE}/apresentacao`, "_blank");
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw", height: "100vh",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 30%, #16162a 0%, #08080f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      {/* Botões flutuantes no topo */}
      <div style={{
        position:"fixed", top:12, right:12,
        display:"flex", gap:8, zIndex:100,
      }}>
        <button
          onClick={reload}
          title="Recarregar app"
          style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"6px 12px", borderRadius:8,
            background:"rgba(255,255,255,0.08)",
            border:"1px solid rgba(255,255,255,0.12)",
            color:"rgba(255,255,255,0.5)",
            fontSize:11, fontWeight:700, cursor:"pointer",
          }}
        >
          <RotateCcw size={13} /> Reiniciar
        </button>
        <button
          onClick={openDesktop}
          title="Abrir vista desktop + mobile"
          style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"6px 12px", borderRadius:8,
            background:"rgba(255,255,255,0.08)",
            border:"1px solid rgba(255,255,255,0.12)",
            color:"rgba(255,255,255,0.5)",
            fontSize:11, fontWeight:700, cursor:"pointer",
          }}
        >
          <Monitor size={13} /> Split-screen
        </button>
        <button
          onClick={openPopup}
          title="Abrir como popup isolado"
          style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"6px 12px", borderRadius:8,
            background:"rgba(139,92,246,0.25)",
            border:"1px solid rgba(139,92,246,0.4)",
            color:"#c4b5fd",
            fontSize:11, fontWeight:700, cursor:"pointer",
          }}
        >
          <Maximize2 size={13} /> Popup isolado
        </button>
      </div>

      {/* Reflexos decorativos no fundo */}
      <div style={{
        position:"fixed", top:"-20%", left:"50%", transform:"translateX(-50%)",
        width:600, height:400,
        background:"radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)",
        pointerEvents:"none",
      }} />

      {/* Moldura do celular */}
      <SmartphoneFrame iframeRef={iframeRef} src={src} scale={scale} />

      {/* Dica de tela cheia */}
      <p style={{
        color:"rgba(255,255,255,0.18)", fontSize:11,
        fontFamily:"monospace", letterSpacing:0.5,
        marginTop: scale < 1 ? 0 : 4,
      }}>
        F12 fecha o DevTools · F11 tela cheia
      </p>
    </div>
  );
};

export default Celular;
