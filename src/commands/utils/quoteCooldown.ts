const QUOTE_GLOBAL_COOLDOWN_MS = 10_000;

let lastQuoteCommandAt = 0;

export function getGlobalQuoteCooldownRemainingMs(now: number = Date.now()): number {
    return Math.max(0, QUOTE_GLOBAL_COOLDOWN_MS - (now - lastQuoteCommandAt));
}

export function tryConsumeGlobalQuoteCooldown(now: number = Date.now()): { ok: boolean; remainingSeconds: number } {
    const remainingMs = getGlobalQuoteCooldownRemainingMs(now);
    if (remainingMs > 0) {
        return {
            ok: false,
            remainingSeconds: Math.ceil(remainingMs / 1000)
        };
    }

    lastQuoteCommandAt = now;
    return { ok: true, remainingSeconds: 0 };
}
