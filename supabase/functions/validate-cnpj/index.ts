import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { cnpj } = await req.json();
    const digits = String(cnpj || "").replace(/\D/g, "");
    if (digits.length !== 14) {
      return new Response(JSON.stringify({ valid: false, error: "CNPJ inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (!res.ok) {
      return new Response(JSON.stringify({ valid: false, error: "CNPJ não encontrado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();

    // If authenticated, persist on profile
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: u } = await supabase.auth.getUser(token);
      if (u?.user) {
        await supabase
          .from("profiles")
          .update({ cnpj: digits, verified: true })
          .eq("id", u.user.id);
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        cnpj: digits,
        razaoSocial: data.razao_social,
        nomeFantasia: data.nome_fantasia,
        situacao: data.descricao_situacao_cadastral,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
