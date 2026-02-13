import { Profanity, CensorType } from "@2toad/profanity";

// Configure with maximum strictness while avoiding false positives
const strictProfanity = new Profanity({
    languages: ["en"],
    wholeWord: true, // Use whole word matching to avoid false positives
});

/**
 * Apply secondary profanity filter using @2toad/profanity library
 * This is used as a second layer after the custom profanity filter
 * @param text - Text to filter (will be coerced to string if not already)
 * @returns Filtered text with profanity censored
 */
export function applySecondaryFilter(text: unknown): string {
    const textStr = String(text || "");
    if (textStr.length === 0) return textStr;
    return strictProfanity.censor(textStr, CensorType.Word);
}

/**
 * Check if text contains profanity using secondary filter
 * @param text - Text to check
 * @returns True if profanity is detected
 */
export function hasSecondaryProfanity(text: string): boolean {
    if (typeof text !== "string" || text.length === 0) return false;
    return strictProfanity.exists(text);
}
