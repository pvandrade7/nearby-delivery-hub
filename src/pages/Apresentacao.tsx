import { useEffect, useRef, useState, useCallback } from "react";
import { Monitor, Smartphone, Link2, Link, RotateCcw, ExternalLink } from "lucide-react";

// ── Constantes ────────────────────────────────────────────────────────────────

const BASE          = window.location.origin;
const INITIAL_PATH  = "/";

// ── Moldura do smartphone ─────────────────────────────────────────────────────

interface PhoneFrameProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  src:       string;
  scale:     number;
}

const PhoneFrame = ({ iframeRef, src, scale }: PhoneFrameProps) => (
  <div
    style={{
      transformOrigin: "top center",
      transform: `scale(${scale})`,
      // Ocupa apenas o espaço real (após scale) para não deslocar o layout
      marginBottom: `${-(862 * (1 - scale))}px`,
    }}
  >
    {/* ── Corpo externo do celular ── */}
    <div
      style={{
        position:     "relative",
        width:        428,
        background:   "linear-gradient(160deg, #1c1c22 0%, #0e0e12 100%)",
        borderRadius: 54,
        padding:      "12px 18px 16px",
        boxShadow: [
          "0 0 0 1px #2a2a35",
          "0 0 0 2px #111116",
          "0 50px 150px rgba(0,0,0,0.95)",
          "inset 0 1px 0 rgba(255,255,255,0.06)",
          "inset 0 -1px 0 rgba(0,0,0,0.4)",
        ].join(", "),
      }}
    >
      {/* Botão mute (esquerda) */}
      <div style={{
        position: "absolute", left: -5, top: 110,
        width: 4, height: 28, borderRadius: "4px 0 0 4px",
        background: "linear-gradient(180deg, #2a2a35, #1a1a22)",
        boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08), -1px 0 2px rgba(0,0,0,0.6)",
      }} />
      {/* Volume + (esquerda) */}
      <div style={{
        position: "absolute", left: -5, top: 170,
        width: 4, height: 44, borderRadius: "4px 0 0 4px",
        background: "linear-gradient(180deg, #2a2a35, #1a1a22)",
        boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08), -1px 0 2px rgba(0,0,0,0.6)",
      }} />
      {/* Volume - (esquerda) */}
      <div style={{
        position: "absolute", left: -5, top: 228,
        width: 4, height: 44, borderRadius: "4px 0 0 4px",
        background: "linear-gradient(180deg, #2a2a35, #1a1a22)",
        boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08), -1px 0 2px rgba(0,0,0,0.6)",
      }} />
      {/* Power (direita) */}
      <div style={{
        position: "absolute", right: -5, top: 195,
        width: 4, height: 60, borderRadius: "0 4px 4px 0",
        background: "linear-gradient(180deg, #2a2a35, #1a1a22)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.08), 1px 0 2px rgba(0,0,0,0.6)",
      }} />

      {/* ── Tela ── */}
      <div style={{
        width: 390, height: 844,
        borderRadius: 44,
        overflow: "hidden",
        background: "#000",
        position: "relative",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: "absolute",
          top: 12, left: "50%", transform: "translateX(-50%)",
          width: 122, height: 36,
          background: "#000",
          borderRadius: 20,
          zIndex: 30,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04)",
        }} />

        {/* Status bar (decorativa) */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 54, zIndex: 20,
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 28px 8px",
          pointerEvents: "none",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)",
        }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: -0.3 }}>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Signal */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
              <rect x="0"  y="8" width="3" height="4" rx="0.5" />
              <rect x="4"  y="5" width="3" height="7" rx="0.5" />
              <rect x="8"  y="2" width="3" height="10" rx="0.5" />
              <rect x="12" y="0" width="3" height="12" rx="0.5" opacity="0.4" />
            </svg>
            {/* WiFi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
              <path d="M8 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
              <path d="M3.6 7.1a6.2 6.2 0 0 1 8.8 0" strokeWidth="1.5" stroke="white" fill="none" strokeLinecap="round" />
              <path d="M1 4.5a9.8 9.8 0 0 1 14 0"  strokeWidth="1.5" stroke="white" fill="none" strokeLinecap="round" />
            </svg>
            {/* Battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" fill="white">
              <rect x="0" y="1" width="21" height="10" rx="2.5" stroke="white" strokeWidth="1.2" fill="none" />
              <rect x="1.5" y="2.5" width="16" height="7" rx="1.5" fill="white" />
              <path d="M22.5 4v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </svg>
          </div>
        </div>

        {/* iframe ocupa da barra de status até o final */}
        <iframe
          ref={iframeRef}
          src={src}
          title="Mobile View"
          style={{
            position: "absolute",
            top: 54, left: 0,
            width: 390, height: 790,
            border: "none",
            display: "block",
          }}
          allow="same-origin"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock"
        />

        {/* Home indicator */}
        <div style={{
          position: "absolute", bottom: 8, left: "50%",
          transform: "translateX(-50%)",
          width: 134, height: 5,
          background: "rgba(255,255,255,0.28)",
          borderRadius: 3,
          zIndex: 30,
          pointerEvents: "none",
        }} />
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────

const Apresentacao = () => {
  const desktopRef = useRef<HTMLIFrameElement>(null);
  const mobileRef  = useRef<HTMLIFrameElement>(null);
  const rightCol   = useRef<HTMLDivElement>(null);

  const [syncEnabled, setSyncEnabled] = useState(true);
  const [desktopPath, setDesktopPath] = useState(INITIAL_PATH);
  const [mobilePath,  setMobilePath]  = useState(INITIAL_PATH);
  const [phoneScale,  setPhoneScale]  = useState(1);

  // Fontes dos iframes — usar timestamp como cache-bust no reload
  const [desktopSrc, setDesktopSrc] = useState(`${BASE}${INITIAL_PATH}${""}`);
  const [mobileSrc,  setMobileSrc]  = useState(`${BASE}${INITIAL_PATH}${""}`);

  // ── Escala dinâmica da moldura de celular ──────────────────────────────
  useEffect(() => {
    const update = () => {
      if (!rightCol.current) return;
      const availH = rightCol.current.clientHeight - 44; // menos header da coluna
      const phoneH = 862 + 16; // altura natural da moldura + padding
      setPhoneScale(Math.min(1, availH / phoneH));
    };
    update();
    const ro = new ResizeObserver(update);
    if (rightCol.current) ro.observe(rightCol.current);
    return () => ro.disconnect();
  }, []);

  // ── Sincronização de navegação entre iframes ───────────────────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "vendy_nav" || typeof e.data.path !== "string") return;
      const path = e.data.path as string;
      const src  = e.source as Window | null;

      const isDesktop = src === desktopRef.current?.contentWindow;
      const isMobile  = src === mobileRef.current?.contentWindow;

      if (isDesktop) setDesktopPath(path);
      if (isMobile)  setMobilePath(path);

      if (!syncEnabled) return;
      // Propaga apenas para o iframe oposto (evita loop)
      if (isDesktop) mobileRef.current?.contentWindow?.postMessage({ type: "vendy_navigate", path }, "*");
      if (isMobile)  desktopRef.current?.contentWindow?.postMessage({ type: "vendy_navigate", path }, "*");
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [syncEnabled]);

  // ── Reload dos iframes ─────────────────────────────────────────────────
  const reload = useCallback(() => {
    const bust = `${BASE}${INITIAL_PATH}${""}&_=${Date.now()}`;
    setDesktopSrc(bust);
    setMobileSrc(bust);
    setDesktopPath(INITIAL_PATH);
    setMobilePath(INITIAL_PATH);
  }, []);

  // ── Abrir em abas separadas ───────────────────────────────────────────
  const openSeparate = () => {
    window.open(`${BASE}${INITIAL_PATH}${""}`, "_blank");
    // Pequeno delay para não disparar bloqueador de popup
    setTimeout(() => {
      const mobileWin = window.open("about:blank", "_blank");
      if (mobileWin) {
        mobileWin.document.write(`
          <html><head>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { background: #0a0a0f; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            </style>
          </head><body>
            <iframe src="${BASE}${INITIAL_PATH}${""}"
              style="width:390px;height:844px;border:0;border-radius:20px;box-shadow:0 20px 80px rgba(0,0,0,0.8)">
            </iframe>
          </body></html>
        `);
      }
    }, 300);
  };

  // ── URL label truncada ─────────────────────────────────────────────────
  const UrlBadge = ({ path }: { path: string }) => (
    <div className="flex-1 min-w-0 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
      <p className="text-white/40 text-[11px] font-mono truncate leading-none">{BASE}{path}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#080810" }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>

        {/* Marca */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
            >
              V+
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">Vendy+</span>
          </div>
          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.15)" }} />
          <span className="text-white/40 text-sm font-medium">Modo Apresentação</span>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2">
          {/* Sync toggle */}
          <button
            onClick={() => setSyncEnabled((v) => !v)}
            title={syncEnabled ? "Desativar sincronização" : "Ativar sincronização"}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
            style={syncEnabled
              ? { background: "rgba(34,197,94,0.15)", color: "#4ade80", borderColor: "rgba(34,197,94,0.3)" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }
            }
          >
            {syncEnabled ? <Link className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {syncEnabled ? "Sincronizado" : "Independente"}
          </button>

          {/* Reiniciar */}
          <button
            onClick={reload}
            title="Reiniciar ambos os iframes"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>

          {/* Abrir em abas separadas */}
          <button
            onClick={openSeparate}
            title="Abrir desktop e mobile em abas separadas"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir em abas
          </button>
        </div>
      </header>

      {/* ══ CORPO ════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 gap-4 p-4 min-h-0">

        {/* ── Coluna Desktop ─────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 gap-2">
          {/* Label + URL */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)" }}
            >
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 text-xs font-bold">Desktop</span>
            </div>
            <UrlBadge path={desktopPath} />
          </div>

          {/* iframe desktop */}
          <div
            className="flex-1 rounded-xl overflow-hidden min-h-0"
            style={{
              border:     "1px solid rgba(255,255,255,0.08)",
              boxShadow:  "0 0 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.02)",
              background: "#fff",
            }}
          >
            <iframe
              ref={desktopRef}
              src={desktopSrc}
              title="Desktop View"
              className="w-full h-full block border-0"
              allow="same-origin"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock"
            />
          </div>
        </div>

        {/* ── Coluna Mobile ───────────────────────────────────────── */}
        <div ref={rightCol} className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 450 }}>
          {/* Label + URL */}
          <div className="flex items-center gap-2 w-full">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}
            >
              <Smartphone className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-300 text-xs font-bold">Mobile</span>
              <span className="text-green-300/50 text-[11px]">iPhone 14</span>
            </div>
            <UrlBadge path={mobilePath} />
          </div>

          {/* Moldura de celular + iframe */}
          <div className="flex-1 flex items-start justify-center pt-2 w-full overflow-hidden">
            <PhoneFrame iframeRef={mobileRef} src={mobileSrc} scale={phoneScale} />
          </div>
        </div>

      </div>

      {/* ══ RODAPÉ ═══════════════════════════════════════════════════════ */}
      <footer
        className="flex items-center justify-between px-5 py-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-white/25 text-[11px] font-medium">
          Ambas as visualizações usam dados de demonstração · navegação{" "}
          {syncEnabled ? "sincronizada entre as duas telas" : "independente em cada tela"}
        </p>
        <p className="text-white/20 text-[11px]">
          Dica: pressione F11 para tela cheia · use Ctrl+- para afastar
        </p>
      </footer>
    </div>
  );
};

export default Apresentacao;
