import { supabase } from "@/integrations/supabase/client";

/**
 * Registra uma ação de auditoria client-side.
 * Fire-and-forget — erros são silenciosos para não bloquear o fluxo principal.
 */
export const logAudit = async (
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as unknown as { from: (t: string) => unknown })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("audit_logs" as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        user_id:     user?.id ?? null,
        action,
        entity_type: entityType ?? null,
        entity_id:   entityId   ?? null,
        details:     details    ?? null,
      } as never);
  } catch {
    // log silencioso — auditoria não deve quebrar o fluxo principal
  }
};
