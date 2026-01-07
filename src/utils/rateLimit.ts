interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const STORAGE_KEY = 'czolko_rate_limits';

function getStorage(): Record<string, RateLimitEntry> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setStorage(data: Record<string, RateLimitEntry>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function checkRateLimit(
  action: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const storage = getStorage();
  const entry = storage[action];

  for (const key of Object.keys(storage)) {
    if (storage[key].resetAt < now) {
      delete storage[key];
    }
  }

  if (!entry || entry.resetAt < now) {
    storage[action] = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    setStorage(storage);
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      retryAfter: entry.resetAt - now,
    };
  }

  entry.count++;
  setStorage(storage);
  return { allowed: true };
}

export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  action: string,
  config: RateLimitConfig
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const result = checkRateLimit(action, config);
    if (!result.allowed) {
      const seconds = Math.ceil((result.retryAfter ?? 0) / 1000);
      throw new Error(`Rate limited. Please wait ${seconds} seconds.`);
    }
    return fn(...args) as Promise<ReturnType<T>>;
  };
}

export const RATE_LIMITS = {
  createLobby: { maxRequests: 5, windowMs: 60 * 1000 },
  joinLobby: { maxRequests: 10, windowMs: 60 * 1000 },
  updateSeat: { maxRequests: 20, windowMs: 60 * 1000 },
  assignWord: { maxRequests: 10, windowMs: 60 * 1000 },
  genericWrite: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;
