import { Logger } from "../../../index.js";

const TOGETHER_MODEL = "ServiceNow-AI/Apriel-1.6-15b-Thinker";
const REQUEST_TIMEOUT_MS = 5000;
const MAX_INPUT_LENGTH = 280;
const MAX_OUTPUT_LENGTH = 280;
const CACHE_LIMIT = 512;

const aiCensorCache = new Map<string, string>();
let warnedMissingKey = false;
let warnedInitFailure = false;
let togetherClient: any | null = null;

function readCache(key: string): string | undefined {
    const value = aiCensorCache.get(key);
    if (value === undefined) return undefined;
    aiCensorCache.delete(key);
    aiCensorCache.set(key, value);
    return value;
}

function writeCache(key: string, value: string): void {
    if (aiCensorCache.size >= CACHE_LIMIT) {
        const oldest = aiCensorCache.keys().next().value as string | undefined;
        if (oldest !== undefined) aiCensorCache.delete(oldest);
    }
    aiCensorCache.set(key, value);
}

function sanitizeForPrompt(text: string): string {
    return String(text ?? "")
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_INPUT_LENGTH);
}

function extractFinalReply(rawContent: string): string {
    const content = String(rawContent ?? "").trim();
    if (!content) return "";

    const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        const finalMatch = line.match(/^(?:FINAL|Final answer)\s*:\s*"?(.{1,500}?)"?$/);
        if (finalMatch?.[1]) return finalMatch[1].trim();
    }

    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        if (line.length >= 1) {
            return line.replace(/^["']|["']$/g, "").trim();
        }
    }

    return "";
}

function looksSuspicious(message: string): boolean {
    const text = String(message ?? "");
    if (!text.trim()) return false;

    if (/[^\x20-\x7E]/.test(text)) return true;
    if (/[A-Za-z][^A-Za-z0-9\s]{1,}[A-Za-z]/.test(text)) return true;
    if (/[\(\)\[\]\{\}<>|\\/_~`^*+=#@%$]{2,}/.test(text)) return true;

    const tokens = text.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
        if (token.length < 3) continue;
        const letters = (token.match(/[A-Za-z]/g) ?? []).length;
        const digits = (token.match(/[0-9]/g) ?? []).length;
        const symbols = (token.match(/[^A-Za-z0-9]/g) ?? []).length;
        if (letters >= 1 && symbols >= 1) return true;
        if (digits >= 2 && symbols >= 1 && letters >= 1) return true;
    }

    return false;
}

async function getTogetherClient(apiKey: string): Promise<any | null> {
    if (togetherClient) return togetherClient;

    try {
        const moduleName = "together-ai";
        const togetherModule: any = await import(moduleName);
        const Together = togetherModule?.default ?? togetherModule;
        togetherClient = new Together({ apiKey });
        return togetherClient;
    } catch (error) {
        if (!warnedInitFailure) {
            const reason = error instanceof Error ? error.message : String(error);
            Logger.warn(`Smart censor disabled: failed to initialize Together client (${reason}).`);
            warnedInitFailure = true;
        }
        return null;
    }
}

async function requestAiCensor(message: string, apiKey: string): Promise<string | null> {
    const client = await getTogetherClient(apiKey);
    if (!client) return null;

    const userText = sanitizeForPrompt(message);
    const prompt = [
        "You are a strict Minecraft chat censor.",
        "Censor any profanity, hate speech, slurs, sexual content, harassment, self-harm encouragement, and suspicious obfuscated variants.",
        "Replace unsafe spans with [censored].",
        "Keep safe words as-is and preserve message structure as much as possible.",
        "Return exactly one line in this format: FINAL: <censored text>.",
        `Input: "${userText}"`
    ].join(" ");

    const request = client.chat.completions.create({
        model: TOGETHER_MODEL,
        messages: [
            { role: "system", content: "You output only censored chat text." },
            { role: "user", content: prompt }
        ],
        max_tokens: 256,
        temperature: 0.1,
        top_p: 0.9
    });

    const timeout = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), REQUEST_TIMEOUT_MS);
    });

    const response: any = await Promise.race([request, timeout]);
    if (!response) return null;

    const rawText = response?.choices?.[0]?.message?.content ?? "";
    const parsed = extractFinalReply(String(rawText)).slice(0, MAX_OUTPUT_LENGTH).trim();
    if (!parsed) return null;

    return parsed;
}

export async function maybeSmartCensorMessage(
    message: string,
    options: {
        enabled: boolean;
        apiKey: string;
    }
): Promise<string | null> {
    if (!options.enabled) return null;

    const apiKey = String(options.apiKey ?? "").trim();
    if (!apiKey) {
        if (!warnedMissingKey) {
            Logger.warn("Smart censor enabled but together_api_key is blank. Falling back to regular censor.");
            warnedMissingKey = true;
        }
        return null;
    }

    const normalized = String(message ?? "");
    if (!looksSuspicious(normalized)) return null;

    const cached = readCache(normalized);
    if (cached !== undefined) return cached;

    try {
        const result = await requestAiCensor(normalized, apiKey);
        if (!result) return null;
        writeCache(normalized, result);
        return result;
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        Logger.warn(`Smart censor request failed, using regular censor (${reason}).`);
        return null;
    }
}
