/**
 * Rate limiter em memória para Edge Functions.
 *
 * Usa janela deslizante por chave (IP ou user_id).
 * A memória é compartilhada dentro de uma mesma instância Deno,
 * mas não persiste entre cold starts — adequado como primeira camada de defesa.
 *
 * Para rate limiting distribuído em produção, substitua pela integração
 * com Upstash Redis (https://upstash.com/docs/redis/quickstarts/supabase).
 */

type Window = { timestamps: number[] };
const store = new Map<string, Window>();

/**
 * Verifica se a chave excedeu o limite.
 * @param key        Identificador (ex: "ip:192.168.1.1" ou "user:uuid:create-payment")
 * @param limit      Máximo de requisições permitidas na janela
 * @param windowMs   Tamanho da janela em milissegundos
 * @returns `true` se permitido, `false` se bloqueado
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const entry = store.get(key) ?? { timestamps: [] };
  // Remove timestamps fora da janela
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    store.set(key, entry);
    return false; // bloqueado
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return true; // permitido
}

/**
 * Extrai o IP real da requisição respeitando proxies.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Constrói a chave de rate limiting combinando IP + identificador de função.
 */
export function rateLimitKey(req: Request, fn: string, userId?: string): string {
  const ip = getClientIp(req);
  return userId ? `user:${userId}:${fn}` : `ip:${ip}:${fn}`;
}
