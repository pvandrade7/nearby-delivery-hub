/**
 * payment-webhook — recebe notificações de pagamento dos gateways.
 *
 * Mercado Pago: POST com body { action, data: { id } }
 *               Header x-signature para verificação (opcional)
 * Asaas:        POST com body { event, payment: { id, status } }
 *
 * Env vars:
 *   PAYMENT_GATEWAY         = "mercadopago" | "asaas" | "simulation"
 *   PAYMENT_GATEWAY_TOKEN   = token do gateway (para buscar status)
 *   PAYMENT_WEBHOOK_SECRET  = secret para validar assinatura (opcional)
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
  });

// ── Verifica assinatura Mercado Pago ────────────────────
async function verifyMPSignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  if (!secret) return true; // sem secret configurado, aceita tudo (dev)

  const xSig = req.headers.get("x-signature") ?? "";
  const xReqId = req.headers.get("x-request-id") ?? "";

  const parts: Record<string, string> = {};
  xSig.split(",").forEach((part) => {
    const [k, v] = part.trim().split("=");
    if (k && v) parts[k] = v;
  });

  const ts    = parts["ts"] ?? "";
  const v1    = parts["v1"] ?? "";
  const dataId = JSON.parse(rawBody)?.data?.id ?? "";

  const manifest = `id:${dataId};request-id:${xReqId};ts:${ts};`;
  const key  = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === v1;
}

// ── Busca status atualizado no Mercado Pago ─────────────
async function getMPPaymentStatus(externalId: string, token: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`MP status fetch failed: ${res.status}`);
  const data = await res.json();
  return data.status as string; // "approved" | "pending" | "rejected" | ...
}

// ── Busca status atualizado no Asaas ───────────────────
async function getAsaasPaymentStatus(externalId: string, token: string) {
  const res = await fetch(`https://api.asaas.com/api/v3/payments/${externalId}`, {
    headers: { "access_token": token },
  });
  if (!res.ok) throw new Error(`Asaas status fetch failed: ${res.status}`);
  const data = await res.json();
  // Asaas: CONFIRMED = approved, PENDING = pending, OVERDUE/DELETED = cancelled
  const map: Record<string, string> = {
    CONFIRMED: "approved", RECEIVED: "approved",
    PENDING:   "pending",  OVERDUE:  "expired",
    DELETED:   "cancelled",
  };
  return map[data.status] ?? "pending";
}

// ── Handler principal ────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: buildCorsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Método não suportado." }, 405);

  const gateway = (Deno.env.get("PAYMENT_GATEWAY") ?? "simulation") as string;
  const token   = Deno.env.get("PAYMENT_GATEWAY_TOKEN") ?? "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rawBody = await req.text();
  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody); }
  catch { return json(req, { error: "Body inválido." }, 400); }

  try {
    let externalId: string | null = null;
    let newStatus: string | null  = null;

    if (gateway === "mercadopago") {
      // Verifica assinatura
      const valid = await verifyMPSignature(req, rawBody);
      if (!valid) return json(req, { error: "Assinatura inválida." }, 401);

      const action = body.action as string;
      if (action !== "payment.updated" && action !== "payment.created") {
        return json(req, { received: true, skipped: true }); // ignora outros eventos
      }
      externalId = String((body.data as {id: unknown})?.id ?? "");
      if (externalId && token) {
        const mpStatus = await getMPPaymentStatus(externalId, token);
        const map: Record<string, string> = {
          approved: "approved", rejected: "rejected",
          cancelled: "cancelled", charged_back: "cancelled",
        };
        newStatus = map[mpStatus] ?? "pending";
      }

    } else if (gateway === "asaas") {
      const event = body.event as string;
      const payment = body.payment as Record<string, unknown> ?? {};
      externalId = String(payment.id ?? "");
      if (event?.startsWith("PAYMENT_") && externalId && token) {
        newStatus = await getAsaasPaymentStatus(externalId, token);
      }

    } else if (gateway === "simulation") {
      // Modo simulação: aceita { payment_id, status }
      const pid = String(body.payment_id ?? "");
      const s   = String(body.status ?? "approved");
      if (pid) {
        await supabase.from("payments").update({ status: s, paid_at: s === "approved" ? new Date().toISOString() : null }).eq("id", pid);
        if (s === "approved") {
          const { data: pay } = await supabase.from("payments").select("order_id").eq("id", pid).single();
          if (pay?.order_id) {
            await supabase.from("orders").update({ status: "aprovado" }).eq("id", pay.order_id);
          }
        }
        return json(req, { received: true });
      }
    }

    if (!externalId) return json(req, { received: true, skipped: true });

    // Busca o payment pelo external_id
    const { data: payRow, error: payErr } = await supabase
      .from("payments")
      .select("id, order_id, status")
      .eq("external_id", externalId)
      .maybeSingle();

    if (payErr || !payRow) {
      console.error("[webhook] payment não encontrado:", externalId);
      return json(req, { received: true, warning: "payment not found" });
    }

    if (!newStatus || payRow.status === newStatus) {
      return json(req, { received: true, skipped: true }); // sem mudança
    }

    // Atualiza payment
    await supabase.from("payments").update({
      status:   newStatus,
      paid_at:  newStatus === "approved" ? new Date().toISOString() : null,
    }).eq("id", payRow.id);

    // Se aprovado, atualiza o pedido
    if (newStatus === "approved" && payRow.order_id) {
      await supabase.from("orders")
        .update({ status: "aprovado" })
        .eq("id", payRow.order_id);

      // Registra no audit log
      await supabase.from("audit_logs").insert({
        user_id:     null,
        action:      "payment_approved",
        entity_type: "payment",
        entity_id:   payRow.id,
        details: { external_id: externalId, gateway, order_id: payRow.order_id },
      });
    }

    return json(req, { received: true, status: newStatus });

  } catch (err) {
    console.error("[payment-webhook]", err);
    // Retorna 200 para o gateway não retentar indefinidamente
    return json(req, { received: true, error: String(err) });
  }
});
