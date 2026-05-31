import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Normaliza o nome de uma cidade para comparação (sem acento, lowercase) */
export const normalizeCity = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/**
 * Retorna a cidade do usuário detectada a partir de:
 * 1. Endereço padrão (tabela addresses)
 * 2. Qualquer endereço cadastrado
 * 3. Campo extras.city do perfil
 */
export function useUserCity() {
  const { user } = useAuth();
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      // 1. Endereço padrão
      const { data: defAddr } = await supabase
        .from("addresses").select("city")
        .eq("user_id", user.id).eq("is_default", true)
        .maybeSingle();
      if (!cancelled && defAddr?.city) { setCity(defAddr.city); setLoading(false); return; }

      // 2. Qualquer endereço
      const { data: anyAddr } = await supabase
        .from("addresses").select("city")
        .eq("user_id", user.id).order("created_at").limit(1)
        .maybeSingle();
      if (!cancelled && anyAddr?.city) { setCity(anyAddr.city); setLoading(false); return; }

      // 3. extras do perfil
      const { data: prof } = await supabase
        .from("profiles").select("extras").eq("id", user.id).maybeSingle();
      const ext = prof?.extras as Record<string, string> | null;
      if (!cancelled) { setCity(ext?.city ?? null); setLoading(false); }
    })();

    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { city, loading };
}
