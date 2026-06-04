import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Headers de segurança para o servidor de desenvolvimento.
// Produção usa nginx.conf (regras mais estritas).
const devSecurityHeaders = {
  "X-Frame-Options":           "DENY",
  "X-Content-Type-Options":    "nosniff",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "X-XSS-Protection":          "1; mode=block",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
  // CSP mais permissiva em dev (permite unsafe-eval para HMR do Vite e React Refresh)
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https: http:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://brasilapi.com.br ws://localhost:* http://localhost:*; " +
    "font-src 'self' data:; " +
    "object-src 'none'; " +
    "base-uri 'self';",
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    headers: devSecurityHeaders,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
