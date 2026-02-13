import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const BAD_WORDS_FILE_URL = new URL("../../../../json/bad_words.json", import.meta.url);
const BAD_WORDS_FILE_PATH = fileURLToPath(BAD_WORDS_FILE_URL);

const EXPLICIT_SHORT_BAD_WORDS = new Set([
    "fk",
    "wtf",
    "kys",
    "dm",
    "vcl",
    "vl",
    "vkl",
    "stfu",
]);

const AMBIGUOUS_TOKENS = new Set([
    "hell",
    "sex",
    "fan",
    "mc",
    "bc",
    "bs",
    "mf",
    "tg",
    "nazi",
    "idiot",
    "abuser",
    "degenerate",
    "crud",
    "pota",
    "bobo",
    "inutil",
    "kainis",
    "putik",
    "kamina",
    "haram",
]);

const SEVERE_BASE_WORDS = [
    "nigger",
    "nigga",
    "faggot",
    "fuck",
    "bitch",
    "cunt",
    "whore",
];
const SEVERE_FIRST_CHARS = new Set(SEVERE_BASE_WORDS.map((word) => word[0]));

const CENSOR_CACHE_LIMIT = 2048;
const censorCache = new Map<string, string>();

const LEET_CHAR_MAP: Record<string, string> = {
    "0": "o",
    "1": "i",
    "2": "z",
    "3": "e",
    "4": "a",
    "5": "s",
    "6": "g",
    "7": "t",
    "8": "b",
    "9": "g",
    "@": "a",
    "$": "s",
    "!": "i",
    "+": "t",
};

const UNICODE_CONFUSABLES: Record<string, string> = {
    "ı": "i",
    "İ": "i",
    "ɪ": "i",
    "ι": "i",
    "і": "i",
    "І": "i",
    "⍳": "i",
    "ᵢ": "i",
    "ⁱ": "i",
    "ο": "o",
    "о": "o",
    "σ": "o",
    "⊙": "o",
    "◯": "o",
    "●": "o",
    "⭕": "o",
    "🔴": "o",
    "⚫": "o",
    "⚪": "o",
    "α": "a",
    "а": "a",
    "∂": "a",
    "⍺": "a",
    "🅰": "a",
    "ε": "e",
    "е": "e",
    "∈": "e",
    "υ": "u",
    "ʋ": "u",
    "ս": "u",
    "∪": "u",
    "ʊ": "u",
    "μ": "u",
    "τ": "t",
    "т": "t",
    "∩": "n",
    "η": "n",
    "п": "n",
    "κ": "k",
    "к": "k",
    "х": "x",
    "с": "c",
    "ѕ": "s",
    "р": "p",
    "у": "y",
    "в": "b",
    "м": "m",
    "ꜱ": "s",
    "ӏ": "i",
    "★": "a",
    "☆": "a",
    "♥": "o",
    "❤": "o",
    "💩": "i",
    "👁": "i",
    "🅸": "i",
    // Circled letters (uppercase A-Z: U+24B6 to U+24CF)
    "Ⓐ": "a",
    "Ⓑ": "b",
    "Ⓒ": "c",
    "Ⓓ": "d",
    "Ⓔ": "e",
    "Ⓕ": "f",
    "Ⓖ": "g",
    "Ⓗ": "h",
    "Ⓘ": "i",
    "Ⓙ": "j",
    "Ⓚ": "k",
    "Ⓛ": "l",
    "Ⓜ": "m",
    "Ⓝ": "n",
    "Ⓞ": "o",
    "Ⓟ": "p",
    "Ⓠ": "q",
    "Ⓡ": "r",
    "Ⓢ": "s",
    "Ⓣ": "t",
    "Ⓤ": "u",
    "Ⓥ": "v",
    "Ⓦ": "w",
    "Ⓧ": "x",
    "Ⓨ": "y",
    "Ⓩ": "z",
    // Circled letters (lowercase a-z: U+24D0 to U+24E9)
    "ⓐ": "a",
    "ⓑ": "b",
    "ⓒ": "c",
    "ⓓ": "d",
    "ⓔ": "e",
    "ⓕ": "f",
    "ⓖ": "g",
    "ⓗ": "h",
    "ⓘ": "i",
    "ⓙ": "j",
    "ⓚ": "k",
    "ⓛ": "l",
    "ⓜ": "m",
    "ⓝ": "n",
    "ⓞ": "o",
    "ⓟ": "p",
    "ⓠ": "q",
    "ⓡ": "r",
    "ⓢ": "s",
    "ⓣ": "t",
    "ⓤ": "u",
    "ⓥ": "v",
    "ⓦ": "w",
    "ⓧ": "x",
    "ⓨ": "y",
    "ⓩ": "z",
    // Cherokee characters that look like Latin letters (uppercase U+13A0-U+13F5)
    "Ꭰ": "d",
    "Ꭱ": "r",
    "Ꭲ": "i",
    "Ꭺ": "a",
    "Ꭻ": "j",
    "Ꮮ": "l",
    "Ꮇ": "m",
    "Ꮎ": "o",
    "Ꮲ": "p",
    "Ꮪ": "s",
    "Ꮖ": "t",
    "Ꮩ": "v",
    "Ꮃ": "w",
    "Ꮍ": "y",
    "Ꮓ": "z",
    // Cherokee small letters (lowercase U+AB70-U+ABBF)
    "ꭰ": "d",
    "ꭱ": "r",
    "ꭲ": "i",
    "ꭺ": "a",
    "ꭻ": "j",
    "ꮮ": "l",
    "ꮇ": "m",
    "ꮎ": "o",
    "ꮲ": "p",
    "ꮪ": "s",
    "ꮖ": "t",
    "ꮩ": "v",
    "ꮃ": "w",
    "ꮍ": "y",
    "ꮓ": "z",
};

let normalizedBadWords: string[] = [];
let BAD_WORD_SET = new Set<string>();
let BAD_WORD_FIRST_CHARS = new Set<string>();
const SEVERE_SUBSTRING_ROOTS = [...new Set([
    "nigger",
    "nigga",
    "faggot",
    "kike",
    "spic",
    "chink",
    "asshole",
])];
const FALLBACK_BAD_WORDS = [...new Set([...SEVERE_BASE_WORDS, ...SEVERE_SUBSTRING_ROOTS])];

function warnFilterConfig(message: string): void {
    console.warn(`[warn] - Profanity filter: ${message}`);
}

function normalizeWordForStorage(word: string): string {
    return String(word ?? "").trim().toLowerCase();
}

function persistBadWordsFile(words: string[]): Promise<void> {
    return writeFile(BAD_WORDS_FILE_URL, JSON.stringify({ words }, null, 2));
}

function rebuildLookup(words: string[]): void {
    normalizedBadWords = [...new Set(
        words
            .map(normalizeWordForStorage)
            .filter((word) => word.length > 0)
    )];

    BAD_WORD_SET = new Set(normalizedBadWords);
    BAD_WORD_FIRST_CHARS = new Set(normalizedBadWords.map((word) => word[0]));
    censorCache.clear();
}

function loadBadWordsFromDisk(): void {
    try {
        const raw = readFileSync(BAD_WORDS_FILE_URL, "utf8");
        const parsed = JSON.parse(raw) as { words?: unknown } | unknown;

        if (!parsed || typeof parsed !== "object" || !("words" in parsed)) {
            warnFilterConfig(`"${BAD_WORDS_FILE_PATH}" is missing the "words" field. Using fallback list.`);
            rebuildLookup(FALLBACK_BAD_WORDS);
            return;
        }

        const words = Array.isArray(parsed.words) ? parsed.words.filter((w): w is string => typeof w === "string") : [];
        if (!Array.isArray(parsed.words)) {
            warnFilterConfig(`"${BAD_WORDS_FILE_PATH}" has invalid "words" format. Using fallback list.`);
            rebuildLookup(FALLBACK_BAD_WORDS);
            return;
        }

        if (words.length === 0) {
            warnFilterConfig(`"${BAD_WORDS_FILE_PATH}" loaded with 0 words. Censoring may be weak until words are added.`);
        }

        rebuildLookup(words);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        warnFilterConfig(`failed to load "${BAD_WORDS_FILE_PATH}" (${reason}). Using fallback list.`);
        rebuildLookup(FALLBACK_BAD_WORDS);
    }
}

loadBadWordsFromDisk();

function maskWord(word: string): string {
    if (word.length <= 1) return word;
    return `${word[0]}${"*".repeat(word.length - 1)}`;
}

function isAsciiWordChar(charCode: number): boolean {
    return (
        (charCode >= 48 && charCode <= 57) ||
        (charCode >= 65 && charCode <= 90) ||
        (charCode >= 97 && charCode <= 122)
    );
}

function normalizeObfuscatedSegment(segment: string): string {
    let out = "";
    
    for (const char of segment) {
        const codePoint = char.codePointAt(0);
        if (codePoint === undefined) continue;
        const lowered = char.toLowerCase();
        
        if (isAsciiWordChar(codePoint)) {
            out += LEET_CHAR_MAP[lowered] ?? lowered;
            continue;
        }

        const mapped =
            LEET_CHAR_MAP[char] ??
            LEET_CHAR_MAP[lowered] ??
            UNICODE_CONFUSABLES[char] ??
            UNICODE_CONFUSABLES[lowered];
        if (mapped) {
            out += mapped;
        }
    }
    return out;
}

function isWordLikeCharacter(char: string): boolean {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) return false;
    if (isAsciiWordChar(codePoint)) return true;

    const lowered = char.toLowerCase();
    return (
        char in LEET_CHAR_MAP ||
        lowered in LEET_CHAR_MAP ||
        char in UNICODE_CONFUSABLES ||
        lowered in UNICODE_CONFUSABLES
    );
}

function isBadWordToken(lowerToken: string): boolean {
    if (lowerToken.length === 0) return false;
    if (AMBIGUOUS_TOKENS.has(lowerToken)) return false;
    if (lowerToken.length <= 2 && !EXPLICIT_SHORT_BAD_WORDS.has(lowerToken)) return false;
    if (!BAD_WORD_FIRST_CHARS.has(lowerToken[0])) return false;
    return BAD_WORD_SET.has(lowerToken);
}

function isEditDistanceAtMostOne(a: string, b: string): boolean {
    if (a === b) return true;
    const alen = a.length;
    const blen = b.length;
    if (Math.abs(alen - blen) > 1) return false;

    if (alen === blen) {
        let mismatch = -1;
        for (let i = 0; i < alen; i += 1) {
            if (a[i] === b[i]) continue;
            if (mismatch !== -1) {
                return i === mismatch + 1
                    && a[mismatch] === b[i]
                    && a[i] === b[mismatch]
                    && a.slice(i + 1) === b.slice(i + 1);
            }
            mismatch = i;
        }
        return mismatch !== -1;
    }

    const longer = alen > blen ? a : b;
    const shorter = alen > blen ? b : a;
    let i = 0;
    let j = 0;
    let skipped = false;
    while (i < longer.length && j < shorter.length) {
        if (longer[i] === shorter[j]) {
            i += 1;
            j += 1;
            continue;
        }
        if (skipped) return false;
        skipped = true;
        i += 1;
    }
    return true;
}

function isLikelySevereVariant(lowerToken: string): boolean {
    if (lowerToken.length < 4) return false;
    if (!SEVERE_FIRST_CHARS.has(lowerToken[0])) return false;

    const severeConfusableMap: Record<string, string> = {
        "0": "o",
        "1": "i",
        "2": "z",
        "3": "e",
        "4": "a",
        "5": "s",
        "6": "g",
        "7": "t",
        "8": "b",
        "9": "g",
        "@": "a",
        "$": "s",
        "!": "i",
        "+": "t",
        "|": "i",
        "l": "i",
    };
    const normalizedSevereToken = lowerToken
        .split("")
        .map((ch) => severeConfusableMap[ch] ?? ch)
        .join("");

    const severeCandidates = new Set<string>([
        lowerToken,
        normalizedSevereToken,
    ]);

    for (const candidate of severeCandidates) {
        for (const base of SEVERE_BASE_WORDS) {
            if (Math.abs(base.length - candidate.length) > 1) continue;
            if (isEditDistanceAtMostOne(candidate, base)) return true;
        }
    }
    return false;
}

const MIN_CONCATENATED_LENGTH = 8;

function hasConcatenatedBadWords(normalized: string): boolean {
    if (normalized.length < MIN_CONCATENATED_LENGTH) return false;
    
    const commonBadWords = ["fuck", "shit", "bitch", "cunt", "whore", "damn", "pussy"];
    const matches: Array<{word: string; start: number; end: number}> = [];
    
    for (const word of commonBadWords) {
        let searchStart = 0;
        while (searchStart < normalized.length) {
            const idx = normalized.indexOf(word, searchStart);
            if (idx === -1) break;
            
            const newStart = idx;
            const newEnd = idx + word.length;
            const overlapsExisting = matches.some(
                (m) => newStart < m.end && newEnd > m.start
            );
            
            if (!overlapsExisting) {
                matches.push({word, start: newStart, end: newEnd});
            }
            
            searchStart = idx + 1;
        }
    }
    
    return matches.length >= 2;
}

function segmentHasBadWord(segment: string): boolean {
    const normalized = normalizeObfuscatedSegment(segment);
    if (isBadWordToken(normalized) || isLikelySevereVariant(normalized)) return true;

    // Check for multiple concatenated bad words (e.g., "fuckyoubitch")
    if (hasConcatenatedBadWords(normalized)) return true;

    // Catch obfuscated/concatenated severe slurs in long tokens.
    // We require at least 2 extra chars around the root to avoid common-word false positives.
    for (const severe of SEVERE_SUBSTRING_ROOTS) {
        const idx = normalized.indexOf(severe);
        if (idx === -1) continue;
        if (normalized.length - severe.length >= 2) return true;
    }

    const usernameCandidate = segment.replace(/^[^A-Za-z0-9_]+|[^A-Za-z0-9_]+$/g, "");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(usernameCandidate)) return false;

    const normalizedCandidate = normalizeObfuscatedSegment(usernameCandidate);
    if (normalizedCandidate.length < 4) return false;

    for (const severe of SEVERE_SUBSTRING_ROOTS) {
        if (normalizedCandidate.includes(severe)) return true;
    }

    return false;
}

type TextSegment = {
    start: number;
    end: number;
    raw: string;
    normalized: string;
};

function collectNonWhitespaceSegments(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    const length = text.length;
    let i = 0;

    while (i < length) {
        if (/\s/.test(text[i])) {
            i += 1;
            continue;
        }

        const start = i;
        i += 1;
        while (i < length && !/\s/.test(text[i])) i += 1;
        const end = i;
        const raw = text.slice(start, end);
        segments.push({
            start,
            end,
            raw,
            normalized: normalizeObfuscatedSegment(raw),
        });
    }

    return segments;
}

function findCensorSpans(text: string): Array<{ start: number; end: number }> {
    const segments = collectNonWhitespaceSegments(text);
    const spans: Array<{ start: number; end: number }> = [];

    const maxJoinSegments = 4;
    let i = 0;
    while (i < segments.length) {
        let bestMatchEndIndex = -1;

        let combined = segments[i].normalized;
        if (isBadWordToken(combined) || segmentHasBadWord(segments[i].raw)) {
            bestMatchEndIndex = i;
        }

        const allowJoinedObfuscation = segments[i].normalized.length <= 2;
        if (allowJoinedObfuscation) {
            for (let j = i + 1; j < segments.length && j < i + maxJoinSegments; j += 1) {
                combined += segments[j].normalized;
                if (combined.length > 48) break;
                if (isBadWordToken(combined)) bestMatchEndIndex = j;
            }
        }

        if (bestMatchEndIndex >= i) {
            spans.push({
                start: segments[i].start,
                end: segments[bestMatchEndIndex].end,
            });
            i = bestMatchEndIndex + 1;
            continue;
        }

        i += 1;
    }

    return spans;
}

function readFromCache(input: string): string | undefined {
    const cached = censorCache.get(input);
    if (cached === undefined) return undefined;
    censorCache.delete(input);
    censorCache.set(input, cached);
    return cached;
}

function writeToCache(input: string, output: string): void {
    if (censorCache.size >= CENSOR_CACHE_LIMIT) {
        const oldestKey = censorCache.keys().next().value as string | undefined;
        if (oldestKey !== undefined) censorCache.delete(oldestKey);
    }
    censorCache.set(input, output);
}

export function getBadWords(): string[] {
    return [...normalizedBadWords];
}

export async function addBadWord(word: string): Promise<boolean> {
    const normalized = normalizeWordForStorage(word);
    if (!normalized) return false;
    if (BAD_WORD_SET.has(normalized)) return false;

    const next = [...normalizedBadWords, normalized];
    rebuildLookup(next);
    await persistBadWordsFile(normalizedBadWords);
    return true;
}

export async function removeBadWord(word: string): Promise<boolean> {
    const normalized = normalizeWordForStorage(word);
    if (!normalized) return false;
    if (!BAD_WORD_SET.has(normalized)) return false;

    const next = normalizedBadWords.filter((entry) => entry !== normalized);
    rebuildLookup(next);
    await persistBadWordsFile(normalizedBadWords);
    return true;
}

export function censorBadWords(text: string): string {
    if (typeof text !== "string" || text.length === 0) return text;

    const cached = readFromCache(text);
    if (cached !== undefined) return cached;

    const spans = findCensorSpans(text);
    if (spans.length === 0) {
        writeToCache(text, text);
        return text;
    }

    const chars = text.split("");
    for (const span of spans) {
        let seenFirstWordChar = false;
        for (let i = span.start; i < span.end; i += 1) {
            if (!isWordLikeCharacter(chars[i])) continue;
            if (!seenFirstWordChar) {
                seenFirstWordChar = true;
                continue;
            }
            chars[i] = "*";
        }
    }

    const censored = chars.join("");
    writeToCache(text, censored);
    return censored;
}

export function hasBadWords(text: string): boolean {
    if (typeof text !== "string" || text.length === 0) return false;
    return findCensorSpans(text).length > 0;
}
