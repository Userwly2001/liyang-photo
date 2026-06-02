// Basic sensitive word filter
const sensitiveWords = [
  'spam', 'spammy', 'viagra', 'casino', 'gambling',
  'xxx', 'porn', 'adult-content',
  'cryptocurrency', 'earn-money-fast',
  'click-here', 'buy-now', 'free-money',
  'scam', 'fraud',
]

// More aggressive patterns (regex)
const sensitivePatterns = [
  /https?:\/\/[^\s]*(?:casino|gambling|porn|xxx|adult|spam)/i,
  /(?:buy|sell|cheap|cheap)\s*(?:now|today|click)/i,
  /earn\s*(?:\$|usd|money|bitcoin|eth)/i,
  /(?:free|limited)\s*(?:offer|deal|trial)/i,
]

export function containsSensitiveContent(text: string): boolean {
  const lower = text.toLowerCase()

  for (const word of sensitiveWords) {
    if (lower.includes(word)) return true
  }

  for (const pattern of sensitivePatterns) {
    if (pattern.test(text)) return true
  }

  return false
}
