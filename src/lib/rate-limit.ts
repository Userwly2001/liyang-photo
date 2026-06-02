const rateStore = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  interval: number // milliseconds
  maxRequests: number
}

export function rateLimit(
  key: string,
  config: RateLimitConfig = { interval: 60_000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + config.interval })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.interval }
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateStore.entries()) {
      if (now > entry.resetAt) rateStore.delete(key)
    }
  }, 300_000)
}
