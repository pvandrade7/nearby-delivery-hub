/**
 * create-payment — gera cobrança PIX e cria o pedido no banco.
 *
 * Gateway selecionado via variável de ambiente PAYMENT_GATEWAY:
 *   "mercadopago" → Mercado Pago API
 *   "asaas"       → Asaas API
 *   "simulation"  → modo local sem gateway (padrão)
 *
 * Chaves necessárias no ambiente Supabase:
 *   PAYMENT_GATEWAY       = "mercadopago" | "asaas" | "simulation"
 *   PAYMENT_GATEWAY_TOKEN = access token do gateway
 */

import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitKey } from "../_shared/rateLimiter.ts";

// ── Schema de entrada ────────────────────────────────────
const bodySchema = z.object({
  cart_items: z.array(z.object({
    name:     z.string(),
    quantity: z.number().int().positive(),
    price:    z.number().positive(),
  })).min(1),
  total:      z.number().positive(),
  store_name: z.string(),
  store_id:   z.string().nullable().optional(),
  address:    z.string().nullable().optional(),
  fulfillment: z.string(),
  user_email:  z.string().optional().default(""),
});

// ── Helpers ──────────────────────────────────────────────
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
  });

// ── Integração Mercado Pago ──────────────────────────────
async function createMercadoPagoPix(params: {
  total: number;
  description: string;
  userEmail: string;
  token: string;
}) {
  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${params.token}`,
      "Content-Type":  "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: params.total,
      description:        params.description,
      payment_method_id:  "pix",
      payer: { email: params.userEmail || "cliente@vendymais.com.br" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Mercado Pago error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const txData = data?.point_of_interaction?.transaction_data;

  return {
    external_id: String(data.id),
    pix_code:    txData?.qr_code ?? "",
    pix_qr_url:  txData?.ticket_url ?? null,
    expires_at:  data.date_of_expiration ?? null,
  };
}

// ── Integração Asaas ─────────────────────────────────────
async function createAsaasPix(params: {
  total: number;
  description: string;
  userEmail: string;
  token: string;
}) {
  // 1. Criar/buscar cliente
  const custRes = await fetch("https://api.asaas.com/api/v3/customers", {
    method: "POST",
    headers: {
      "access_token":  params.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name:  "Cliente Vendy+",
      email: params.userEmail || "cliente@vendymais.com.br",
      cpfCnpj: "00000000000", // placeholder; substitua pelo CPF real do usuário
    }),
  });
  const cust = await custRes.json();
  const customerId = cust.id ?? cust.object;

  // 2. Criar cobrança PIX
  const chargeRes = await fetch("https://api.asaas.com/api/v3/payments", {
    method: "POST",
    headers: {
      "access_token":  params.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer:      customerId,
      billingType:   "PIX",
      value:         params.total,
      dueDate:       new Date(Date.now() + 30 * 60 * 1000).toISOString().split("T")[0],
      description:   params.description,
    }),
  });

  if (!chargeRes.ok) {
    const err = await chargeRes.json().catch(() => ({}));
    throw new Error(`Asaas error ${chargeRes.status}: ${JSON.stringify(err)}`);
  }

  const charge = await chargeRes.json();

  // 3. Buscar QR Code
  const qrRes = await fetch(`https://api.asaas.com/api/v3/payments/${charge.id}/pixQrCode`, {
    headers: { "access_token": params.token },
  });
  const qr = await qrRes.json();

  return {
    external_id: String(charge.id),
    pix_code:    qr.payload ?? "",
    pix_qr_url:  qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null,
    expires_at:  charge.dueDate ? new Date(charge.dueDate).toISOString() : null,
  };
}

// ── Simulação (dev sem gateway) ──────────────────────────
function simulatePix(total: number) {
  const randHex = () => Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, "0").toUpperCase();
  const code = `00020126580014BR.GOV.BCB.PIX0136${crypto.randomUUID()}5204000053039865802BR5913VENDYMAIS6009FORTALEZA62070503***6304${randHex()}`;
  return {
    external_id: `sim-${crypto.randomUUID()}`,
    pix_code:    code,
    pix_qr_url:  null,
    expires_at:  new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
    simulated:   true,
  };
}

// ── Handler principal ────────────────────────────────────
Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  // Rate limiting: 10 pagamentos por usuário/IP a cada 15 minutos
  const rlKey = rateLimitKey(req, "create-payment");
  if (!checkRateLimit(rlKey, 10, 15 * 60 * 1000)) {
    return json(req, { error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  }

  try {
    // Autenticação obrigatória
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(req, { error: "Não autorizado." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) return json(req, { error: "Sessão inválida." }, 401);

    // Validação do body
    const raw  = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return json(req, { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, 400);
    }
    const body = parsed.data;

    // Seleciona gateway
    const gateway = (Deno.env.get("PAYMENT_GATEWAY") ?? "simulation") as string;
    const token   = Deno.env.get("PAYMENT_GATEWAY_TOKEN") ?? "";
    const description = `Pedido Vendy+ — ${body.store_name}`;

    let pixData: {
      external_id: string;
      pix_code:    string;
      pix_qr_url:  string | null;
      expires_at:  string | null;
      simulated?:  boolean;
    };

    if (gateway === "mercadopago" && token) {
      pixData = await createMercadoPagoPix({
        total: body.total, description, userEmail: body.user_email, token,
      });
    } else if (gateway === "asaas" && token) {
      pixData = await createAsaasPix({
        total: body.total, description, userEmail: body.user_email, token,
      });
    } else {
      pixData = simulatePix(body.total);
    }

    // Cria pedido no banco (status: aguardando_pagamento)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        buyer_id:      user.id,
        store_id:      body.store_id ?? null,
        store_name:    body.store_name,
        items:         body.cart_items,
        total:         body.total,
        address:       body.address ?? null,
        payment:       "PIX",
        fulfillment:   body.fulfillment,
        status:        "aguardando_pagamento",
        estimated_min: body.fulfillment === "Entrega" ? 25 : 10,
        estimated_max: body.fulfillment === "Entrega" ? 40 : 20,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      throw new Error(`Erro ao criar pedido: ${orderErr?.message}`);
    }

    // Registra pagamento
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        order_id:    order.id,
        user_id:     user.id,
        gateway,
        external_id: pixData.external_id,
        method:      "pix",
        amount:      body.total,
        status:      "pending",
        pix_code:    pixData.pix_code,
        pix_qr_url:  pixData.pix_qr_url,
        expires_at:  pixData.expires_at,
        metadata:    { store_name: body.store_name, user_email: body.user_email },
      })
      .select("id")
      .single();

    if (payErr || !payment) {
      throw new Error(`Erro ao registrar pagamento: ${payErr?.message}`);
    }

    return json(req, {
      payment_id:  payment.id,
      order_id:    order.id,
      pix_code:    pixData.pix_code,
      pix_qr_url:  pixData.pix_qr_url,
      expires_at:  pixData.expires_at,
      simulated:   !!pixData.simulated,
    });

  } catch (err) {
    console.error("[create-payment]", err);
    return json(req, { error: String(err) }, 500);
  }
});
