/**
 * In-memory progressive rate limiter for login protection.
 * Protects against brute-force attacks and credential stuffing.
 * 
 * Rules:
 * - Up to 5 consecutive failed attempts per account/IP.
 * - Lockout durations:
 *   - 1st lockout: 5 minutes
 *   - 2nd lockout: 15 minutes
 *   - 3rd+ lockout: 60 minutes
 * - Reset counter & lockout state instantly upon successful login.
 */

interface LockState {
  attempts: number;
  blockCount: number;
  blockedUntil: number;
}

const store = new Map<string, LockState>();

// Clean up expired entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of store.entries()) {
    if (state.blockedUntil > 0 && state.blockedUntil < now && state.attempts === 0) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000).unref?.();

function getKey(email: string, ip?: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const cleanIp = ip ? ip.trim() : "unknown";
  return `${cleanEmail}:${cleanIp}`;
}

/** Check if the account/IP is currently blocked. Returns remaining minutes if blocked, 0 if OK. */
export function checkRateLimit(email: string, ip?: string): { isBlocked: boolean; remainingMinutes: number } {
  const key = getKey(email, ip);
  const state = store.get(key);
  if (!state || state.blockedUntil <= Date.now()) {
    return { isBlocked: false, remainingMinutes: 0 };
  }
  const remainingMs = state.blockedUntil - Date.now();
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  return { isBlocked: true, remainingMinutes };
}

/** Record a failed login attempt. If attempts reach 5, trigger progressive lockout. */
export function recordFailedAttempt(
  email: string,
  ip?: string,
): { attemptsLeft: number; isBlocked: boolean; remainingMinutes: number } {
  const key = getKey(email, ip);
  const now = Date.now();
  let state = store.get(key);

  if (!state) {
    state = { attempts: 0, blockCount: 0, blockedUntil: 0 };
    store.set(key, state);
  }

  // If previous block expired, reset attempt count for the new cycle
  if (state.blockedUntil > 0 && state.blockedUntil <= now) {
    state.attempts = 0;
    state.blockedUntil = 0;
  }

  state.attempts += 1;

  if (state.attempts >= 5) {
    state.blockCount += 1;
    state.attempts = 0; // reset attempt counter for next cycle

    // Progressive lockout duration (5m -> 15m -> 60m)
    let lockMinutes = 5;
    if (state.blockCount === 2) lockMinutes = 15;
    else if (state.blockCount >= 3) lockMinutes = 60;

    state.blockedUntil = now + lockMinutes * 60 * 1000;
    return { attemptsLeft: 0, isBlocked: true, remainingMinutes: lockMinutes };
  }

  return { attemptsLeft: 5 - state.attempts, isBlocked: false, remainingMinutes: 0 };
}

/** Reset rate limit state on successful login. */
export function recordLoginSuccess(email: string, ip?: string): void {
  const key = getKey(email, ip);
  store.delete(key);
}

/** Reset all store entries (useful for testing). */
export function resetRateLimiterStore(): void {
  store.clear();
}
