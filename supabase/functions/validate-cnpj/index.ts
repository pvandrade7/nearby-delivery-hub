import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitKey } from "../_shared/rateLimiter.ts";

const bodySchema = z.object({
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório.")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 14, { message: "CNPJ deve ter 14 dígitos." }),
});

const jsonResp = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  // Rate limiting: 20 validações por IP a cada 10 minutos (anti-enumeração de CNPJ)
  const rlKey = rateLimitKey(req, "validate-cnpj");
  if (!checkRateLimit(rlKey, 20, 10 * 60 * 1000)) {
    return jsonResp(req, { valid: false, error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResp(req, { valid: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, 400);
    }
    const digits = parsed.data.cnpj;

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (!res.ok) {
      return jsonResp(req, { valid: false, error: "CNPJ não encontrado na Receita Federal." });
    }
    const data = await res.json();

    // Se autenticado, persiste no perfil via service_role (bypassa RLS)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: u } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (u?.user) {
        await supabase
          .from("profiles")
          .update({ cnpj: digits, verified: true })
          .eq("id", u.user.id);
      }
    }

    return jsonResp(req, {
      valid:       true,
      cnpj:        digits,
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia,
      situacao:    data.descricao_situacao_cadastral,
    });
  } catch (err) {
    return jsonResp(req, { valid: false, error: String(err) }, 500);
  }
});
