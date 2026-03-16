import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const BAD_WORDS_FILE_URL = new URL("../../../../json/bad_words.json", import.meta.url);
const BAD_WORDS_FILE_PATH = fileURLToPath(BAD_WORDS_FILE_URL);
const WORD_WHITELIST_FILE_URL = new URL("../../../../json/word_whitelist.json", import.meta.url);
const WORD_WHITELIST_FILE_PATH = fileURLToPath(WORD_WHITELIST_FILE_URL);

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
    "cock",
    "dick",
    "ass",
    "shit",
];
const SEVERE_FIRST_CHARS = new Set(SEVERE_BASE_WORDS.map((word) => word[0]));

// Chinese character equivalents for slurs - map to English transliterations
const CHINESE_SLUR_MAP: Record<string, string> = {
    "黑鬼": "nigger",  // Severe: "black ghost/devil" - highly offensive Chinese racial slur
    "尼哥": "nigger",  // Severe: phonetic approximation of n-word
    "黑人": "black",   // Moderate: "black person" - less offensive but watch in context
    "傻逼": "fuck",    // Severe: very offensive in Chinese
    "操": "fuck",      // Severe: profanity
    "妈的": "fuck",    // Severe: "damn" literally "mother's"
    "婊子": "bitch",   // Severe: bitch/whore
    "婊": "bitch",     // Severe: shortened form
};

const CENSOR_CACHE_LIMIT = 2048;
const censorCache = new Map<string, string>();
const SPECIAL_CHAR_BOX = "□";

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
    "(": "c",
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
    // Fullwidth Latin characters (U+FF01-U+FF5E)
    "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e", "ｆ": "f", "ｇ": "g",
    "ｈ": "h", "ｉ": "i", "ｊ": "j", "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n",
    "ｏ": "o", "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t", "ｕ": "u",
    "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y", "ｚ": "z",
    "Ａ": "a", "Ｂ": "b", "Ｃ": "c", "Ｄ": "d", "Ｅ": "e", "Ｆ": "f", "Ｇ": "g",
    "Ｈ": "h", "Ｉ": "i", "Ｊ": "j", "Ｋ": "k", "Ｌ": "l", "Ｍ": "m", "Ｎ": "n",
    "Ｏ": "o", "Ｐ": "p", "Ｑ": "q", "Ｒ": "r", "Ｓ": "s", "Ｔ": "t", "Ｕ": "u",
    "Ｖ": "v", "Ｗ": "w", "Ｘ": "x", "Ｙ": "y", "Ｚ": "z",
    // Mathematical alphanumeric symbols - Bold (U+1D400-U+1D433)
    "𝐚": "a", "𝐛": "b", "𝐜": "c", "𝐝": "d", "𝐞": "e", "𝐟": "f", "𝐠": "g",
    "𝐡": "h", "𝐢": "i", "𝐣": "j", "𝐤": "k", "𝐥": "l", "𝐦": "m", "𝐧": "n",
    "𝐨": "o", "𝐩": "p", "𝐪": "q", "𝐫": "r", "𝐬": "s", "𝐭": "t", "𝐮": "u",
    "𝐯": "v", "𝐰": "w", "𝐱": "x", "𝐲": "y", "𝐳": "z",
    "𝐀": "a", "𝐁": "b", "𝐂": "c", "𝐃": "d", "𝐄": "e", "𝐅": "f", "𝐆": "g",
    "𝐇": "h", "𝐈": "i", "𝐉": "j", "𝐊": "k", "𝐋": "l", "𝐌": "m", "𝐍": "n",
    "𝐎": "o", "𝐏": "p", "𝐐": "q", "𝐑": "r", "𝐒": "s", "𝐓": "t", "𝐔": "u",
    "𝐕": "v", "𝐖": "w", "𝐗": "x", "𝐘": "y", "𝐙": "z",
    // Mathematical alphanumeric symbols - Italic
    "𝑎": "a", "𝑏": "b", "𝑐": "c", "𝑑": "d", "𝑒": "e", "𝑓": "f", "𝑔": "g",
    "𝑖": "i", "𝑗": "j", "𝑘": "k", "𝑙": "l", "𝑚": "m", "𝑛": "n",
    "𝑜": "o", "𝑝": "p", "𝑞": "q", "𝑟": "r", "𝑠": "s", "𝑡": "t", "𝑢": "u",
    "𝑣": "v", "𝑤": "w", "𝑥": "x", "𝑦": "y", "𝑧": "z",
    // Small caps and phonetic symbols
    "ɴ": "n", "ɢ": "g", "ʀ": "r", "ᴀ": "a", "ʙ": "b", "ᴄ": "c", "ᴅ": "d",
    "ᴇ": "e", "ꜰ": "f", "ʜ": "h", "ᴊ": "j", "ᴋ": "k",
    "ʟ": "l", "ᴍ": "m", "ᴏ": "o", "ᴘ": "p", "ᴛ": "t", "ᴜ": "u", "ᴠ": "v", "ᴡ": "w", "ʏ": "y", "ᴢ": "z",
    "ɡ": "g",  // Latin small letter script g (U+0261)
    // Subscript letters
    "ₐ": "a", "ₑ": "e", "ₕ": "h", "ⱼ": "j", "ₖ": "k", "ₗ": "l",
    "ₘ": "m", "ₙ": "n", "ₒ": "o", "ₚ": "p", "ᵣ": "r", "ₛ": "s", "ₜ": "t",
    "ᵤ": "u", "ᵥ": "v", "ₓ": "x",
    // Superscript letters
    "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d", "ᵉ": "e", "ᶠ": "f", "ᵍ": "g",
    "ʰ": "h", "ʲ": "j", "ᵏ": "k", "ˡ": "l", "ᵐ": "m", "ⁿ": "n",
    "ᵒ": "o", "ᵖ": "p", "ʳ": "r", "ˢ": "s", "ᵗ": "t", "ᵘ": "u", "ᵛ": "v",
    "ʷ": "w", "ˣ": "x", "ʸ": "y", "ᶻ": "z",
    // Upside down characters (only Unicode lookalikes, not ASCII)
    "ɐ": "a", "ɔ": "c", "ǝ": "e", "ɟ": "f", "ɓ": "b",
    "ɥ": "h", "ᴉ": "i", "ɾ": "r", "ʞ": "k", "ɯ": "m",
    "ɹ": "r", "ʇ": "t", "ʌ": "v", "ʍ": "w", "ʎ": "y",
    // Backwards letters (approximations)
    "ᴎ": "n", "ǫ": "q",
    // More Greek confusables
    "Ϲ": "c", "ⲥ": "c", "ϲ": "c", "Α": "a", "Β": "b", "Ε": "e", "Ζ": "z",
    "Η": "h", "Ι": "i", "Κ": "k", "Μ": "m", "Ν": "n", "Ο": "o", "Ρ": "p",
    "Τ": "t", "Υ": "y", "Χ": "x",
    // Runic characters that look like Latin
    "ᛔ": "b", "ᚱ": "r", "ᛏ": "t", "ᚺ": "h", "ᚠ": "f", "ᛒ": "b",
    // Chinese/Japanese numbers and similar
    "十": "t", "丁": "t", "〇": "o", "○": "o", "零": "o",
    // Enclosed alphanumerics (U+1F100-U+1F1FF)
    "🄰": "a", "🄱": "b", "🄲": "c", "🄳": "d", "🄴": "e", "🄵": "f", "🄶": "g",
    "🄷": "h", "🄸": "i", "🄹": "j", "🄺": "k", "🄻": "l", "🄼": "m", "🄽": "n",
    "🄾": "o", "🄿": "p", "🅀": "q", "🅁": "r", "🅂": "s", "🅃": "t", "🅄": "u",
    "🅅": "v", "🅆": "w", "🅇": "x", "🅈": "y", "🅉": "z",
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
let normalizedWordWhitelist: string[] = [];
let WORD_WHITELIST_SET = new Set<string>();
const SEVERE_SUBSTRING_ROOTS = [...new Set([
    "nigger",
    "nigga",
    "faggot",
    "kike",
    "spic",
    "chink",
    "asshole",
    // Include select SEVERE_BASE_WORDS for compound detection
    // Note: "ass" and "shit" excluded to avoid false positives in words like "assessment", "shitstorm", etc.
    "cock",
    "dick",
    "pussy",
    "cunt",
])];
const FALLBACK_BAD_WORDS = [...new Set([...SEVERE_BASE_WORDS, ...SEVERE_SUBSTRING_ROOTS])];

function warnFilterConfig(message: string): void {
    console.warn(`[warn] - Profanity filter: ${message}`);
}

function normalizeWordForStorage(word: string): string {
    return String(word ?? "").trim().toLowerCase();
}

function normalizeWordForMatch(word: string): string {
    return normalizeObfuscatedSegment(normalizeWordForStorage(word));
}

function persistBadWordsFile(words: string[]): Promise<void> {
    return writeFile(BAD_WORDS_FILE_URL, JSON.stringify({ words }, null, 2));
}

function persistWordWhitelistFile(words: string[]): Promise<void> {
    return writeFile(WORD_WHITELIST_FILE_URL, JSON.stringify({ words }, null, 2));
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

function rebuildWordWhitelistLookup(words: string[]): void {
    normalizedWordWhitelist = [...new Set(
        words
            .map(normalizeWordForMatch)
            .filter((word) => word.length > 0)
    )];
    WORD_WHITELIST_SET = new Set(normalizedWordWhitelist);
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

function loadWordWhitelistFromDisk(): void {
    try {
        const raw = readFileSync(WORD_WHITELIST_FILE_URL, "utf8");
        const parsed = JSON.parse(raw) as { words?: unknown } | unknown;

        if (!parsed || typeof parsed !== "object" || !("words" in parsed)) {
            warnFilterConfig(`"${WORD_WHITELIST_FILE_PATH}" is missing the "words" field. Starting with an empty whitelist.`);
            rebuildWordWhitelistLookup([]);
            return;
        }

        const words = Array.isArray(parsed.words) ? parsed.words.filter((w): w is string => typeof w === "string") : [];
        if (!Array.isArray(parsed.words)) {
            warnFilterConfig(`"${WORD_WHITELIST_FILE_PATH}" has invalid "words" format. Starting with an empty whitelist.`);
            rebuildWordWhitelistLookup([]);
            return;
        }

        rebuildWordWhitelistLookup(words);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        warnFilterConfig(`failed to load "${WORD_WHITELIST_FILE_PATH}" (${reason}). Starting with an empty whitelist.`);
        rebuildWordWhitelistLookup([]);
    }
}

loadBadWordsFromDisk();
loadWordWhitelistFromDisk();

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
        
        // Skip zero-width characters
        if (codePoint === 0x200B || // Zero Width Space
            codePoint === 0x200C || // Zero Width Non-Joiner
            codePoint === 0x200D || // Zero Width Joiner
            codePoint === 0xFEFF) { // Zero Width No-Break Space
            continue;
        }
        
        // Skip combining diacritical marks (U+0300-U+036F)
        if (codePoint >= 0x0300 && codePoint <= 0x036F) {
            continue;
        }
        
        // Skip combining marks for symbols (U+20D0-U+20FF)
        if (codePoint >= 0x20D0 && codePoint <= 0x20FF) {
            continue;
        }
        
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

    // Chinese/CJK characters are word-like
    if ((codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||  // CJK Unified Ideographs
        (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||  // CJK Extension A
        (codePoint >= 0x20000 && codePoint <= 0x2A6DF)) { // CJK Extension B
        return true;
    }

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
    if (WORD_WHITELIST_SET.has(lowerToken)) return false;
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
    if (WORD_WHITELIST_SET.has(normalized)) return false;
    if (isBadWordToken(normalized) || isLikelySevereVariant(normalized)) return true;

    // Check for Chinese slurs only if segment contains CJK characters
    const hasCJK = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(segment);
    if (hasCJK) {
        for (const [chineseSlur, englishEquiv] of Object.entries(CHINESE_SLUR_MAP)) {
            if (segment.includes(chineseSlur)) return true;
            // Also check the normalized version in case it's mixed with other chars
            if (normalized.includes(englishEquiv)) return true;
        }
    }

    // Check for reversed/backwards text
    const reversed = normalized.split("").reverse().join("");
    if (isBadWordToken(reversed) || isLikelySevereVariant(reversed)) return true;

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
    if (WORD_WHITELIST_SET.has(normalizedCandidate)) return false;

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
        if (WORD_WHITELIST_SET.has(segments[i].normalized)) {
            i += 1;
            continue;
        }

        let bestMatchEndIndex = -1;

        let combined = segments[i].normalized;
        if ((!WORD_WHITELIST_SET.has(combined) && isBadWordToken(combined)) || segmentHasBadWord(segments[i].raw)) {
            bestMatchEndIndex = i;
        }

        const allowJoinedObfuscation = segments[i].normalized.length <= 2;
        if (allowJoinedObfuscation) {
            for (let j = i + 1; j < segments.length && j < i + maxJoinSegments; j += 1) {
                combined += segments[j].normalized;
                if (combined.length > 48) break;
                if (WORD_WHITELIST_SET.has(combined)) continue;
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

function isAllowedOutputChar(char: string): boolean {
    return /[A-Za-z0-9\s.,!?'"`:;()[\]{}\-_/\\@#%&*+=<>]/.test(char);
}

function replaceSpecialCharsWithBoxes(text: string): string {
    if (!text) return text;
    let out = "";
    for (const char of text) {
        out += isAllowedOutputChar(char) ? char : SPECIAL_CHAR_BOX;
    }
    return out;
}

export function getBadWords(): string[] {
    return [...normalizedBadWords];
}

export function getWordWhitelist(): string[] {
    return [...normalizedWordWhitelist];
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

export async function addWordWhitelist(word: string): Promise<boolean> {
    const normalized = normalizeWordForMatch(word);
    if (!normalized) return false;
    if (WORD_WHITELIST_SET.has(normalized)) return false;

    const next = [...normalizedWordWhitelist, normalized];
    rebuildWordWhitelistLookup(next);
    await persistWordWhitelistFile(normalizedWordWhitelist);
    return true;
}

export async function removeWordWhitelist(word: string): Promise<boolean> {
    const normalized = normalizeWordForMatch(word);
    if (!normalized) return false;
    if (!WORD_WHITELIST_SET.has(normalized)) return false;

    const next = normalizedWordWhitelist.filter((entry) => entry !== normalized);
    rebuildWordWhitelistLookup(next);
    await persistWordWhitelistFile(normalizedWordWhitelist);
    return true;
}

export function censorBadWords(text: string): string {
    if (typeof text !== "string" || text.length === 0) return text;

    const cached = readFromCache(text);
    if (cached !== undefined) return cached;

    const spans = findCensorSpans(text);
    if (spans.length === 0) {
        const sanitized = replaceSpecialCharsWithBoxes(text);
        writeToCache(text, sanitized);
        return sanitized;
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
    const sanitized = replaceSpecialCharsWithBoxes(censored);
    writeToCache(text, sanitized);
    return sanitized;
}

export function hasBadWords(text: string): boolean {
    if (typeof text !== "string" || text.length === 0) return false;
    return findCensorSpans(text).length > 0;
}
