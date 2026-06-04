/**
 * CORS helpers compartilhados entre Edge Functions.
 *
 * Em produção, configure ALLOWED_ORIGIN no Supabase Secrets:
 *   ALLOWED_ORIGIN=https://vendymais.com.br
 *
 * Em desenvolvimento (ou se ALLOWED_ORIGIN não estiver definido), permite "*".
 */

export function buildCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

  // Se estiver configurado para domínio específico, valida o origin da request
  if (allowedOrigin !== "*") {
    const origin = req.headers.get("origin") ?? "";
    const isAllowed =
      origin === allowedOrigin ||
      origin === allowedOrigin.replace(/^https/, "http"); // fallback http em dev
    return {
      "Access-Control-Allow-Origin":  isAllowed ? origin : allowedOrigin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary":                         "Origin",
    };
  }

  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function handlePreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response("ok", { headers: buildCorsHeaders(req) });
}
