/**
 * Rate Limiter Service
 * Implements local rate limiting for login and registration attempts
 * Uses localStorage to track attempts per email/IP
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after max attempts
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 15 * 60 * 1000 // 15 minutes
};

const RATE_LIMIT_KEY_PREFIX = 'matkeep_ratelimit_';

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil: number | null;
}

/**
 * Check if email/identifier is rate limited
 * Returns { isLimited: boolean, remainingTime: number (in seconds) }
 */
export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { isLimited: boolean; remainingTime: number } => {
  const key = RATE_LIMIT_KEY_PREFIX + identifier;
  const stored = localStorage.getItem(key);
  
  const now = Date.now();
  
  if (!stored) {
    return { isLimited: false, remainingTime: 0 };
  }

  const entry: RateLimitEntry = JSON.parse(stored);

  // Check if currently in blocked period
  if (entry.blockedUntil && entry.blockedUntil > now) {
    const remainingMs = entry.blockedUntil - now;
    return { isLimited: true, remainingTime: Math.ceil(remainingMs / 1000) };
  }

  // Check if time window has expired
  if (now - entry.firstAttemptTime > config.windowMs) {
    localStorage.removeItem(key);
    return { isLimited: false, remainingTime: 0 };
  }

  // Check if max attempts exceeded
  if (entry.attempts >= config.maxAttempts) {
    const newBlockedUntil = now + config.blockDurationMs;
    const updatedEntry: RateLimitEntry = {
      ...entry,
      blockedUntil: newBlockedUntil
    };
    localStorage.setItem(key, JSON.stringify(updatedEntry));
    const remainingMs = newBlockedUntil - now;
    return { isLimited: true, remainingTime: Math.ceil(remainingMs / 1000) };
  }

  return { isLimited: false, remainingTime: 0 };
};

/**
 * Record an attempt for an identifier
 */
export const recordAttempt = (
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): void => {
  const key = RATE_LIMIT_KEY_PREFIX + identifier;
  const stored = localStorage.getItem(key);
  const now = Date.now();

  let entry: RateLimitEntry;

  if (!stored) {
    // New entry
    entry = {
      attempts: 1,
      firstAttemptTime: now,
      blockedUntil: null
    };
  } else {
    entry = JSON.parse(stored);

    // If time window expired, reset
    if (now - entry.firstAttemptTime > config.windowMs) {
      entry = {
        attempts: 1,
        firstAttemptTime: now,
        blockedUntil: null
      };
    } else {
      entry.attempts += 1;

      // If max attempts reached, set block time
      if (entry.attempts >= config.maxAttempts) {
        entry.blockedUntil = now + config.blockDurationMs;
      }
    }
  }

  localStorage.setItem(key, JSON.stringify(entry));
};

/**
 * Clear rate limit entry for identifier
 */
export const clearRateLimit = (identifier: string): void => {
  const key = RATE_LIMIT_KEY_PREFIX + identifier;
  localStorage.removeItem(key);
};

/**
 * Reset rate limit entry (used on successful login)
 */
export const resetRateLimit = (identifier: string): void => {
  clearRateLimit(identifier);
};

/**
 * Get current attempt count (for UI display)
 */
export const getAttemptCount = (
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): number => {
  const key = RATE_LIMIT_KEY_PREFIX + identifier;
  const stored = localStorage.getItem(key);
  const now = Date.now();

  if (!stored) return 0;

  const entry: RateLimitEntry = JSON.parse(stored);

  // If time window expired, return 0
  if (now - entry.firstAttemptTime > config.windowMs) {
    localStorage.removeItem(key);
    return 0;
  }

  return entry.attempts;
};
