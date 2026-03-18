// Rate limiter simple para endpoints de login
const attempts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_ATTEMPTS = 5;

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record || now > record.resetTime) {
    attempts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// Limpiar registros viejos periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts.entries()) {
    if (now > value.resetTime) {
      attempts.delete(key);
    }
  }
}, 60 * 1000);
