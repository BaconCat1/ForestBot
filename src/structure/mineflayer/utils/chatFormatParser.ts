import type { Bot } from "mineflayer";
import parseUsername from "./parseUsername.js";
import { stripMinecraftFormatting } from "./stripMinecraftFormatting.js";

type ChatFormatConfig = {
    useCustomChatFormatParser?: boolean;
    customChatFormats?: string[];
};

type ParsedChatFormatMessage = {
    player: string;
    message: string;
};

function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPatternFromFormat(format: string): RegExp | null {
    const trimmed = String(format ?? "").trim();
    if (!trimmed) return null;
    if (!trimmed.includes("{username}") || !trimmed.includes("{message}")) return null;

    const placeholderPattern = /\{(username|message|skip)\}/g;
    let pattern = "^";
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let hasMessage = false;
    let hasUsername = false;

    while ((match = placeholderPattern.exec(trimmed)) !== null) {
        const literal = trimmed.slice(lastIndex, match.index);
        pattern += escapeRegex(literal).replace(/\s+/g, "\\s*");

        const placeholder = match[1];
        if (placeholder === "username") {
            pattern += "(?<username>.+?)";
            hasUsername = true;
        } else if (placeholder === "message") {
            pattern += "(?<message>.+)";
            hasMessage = true;
        } else {
            pattern += "(?:.+?)";
        }

        lastIndex = match.index + match[0].length;
    }

    const tail = trimmed.slice(lastIndex);
    pattern += escapeRegex(tail).replace(/\s+/g, "\\s*");
    pattern += "$";

    if (!hasUsername || !hasMessage) return null;
    return new RegExp(pattern);
}

export function parseConfiguredChatFormatMessage(
    fullMsg: string,
    bot: Bot,
    config: ChatFormatConfig
): ParsedChatFormatMessage | null {
    if (!config?.useCustomChatFormatParser) return null;

    const formats = Array.isArray(config.customChatFormats) ? config.customChatFormats : [];
    if (formats.length === 0) return null;

    const cleanedMsg = stripMinecraftFormatting(fullMsg ?? "").replace(/\u00c2\u00bb/g, "\u00bb").trim();
    if (!cleanedMsg) return null;

    for (const format of formats) {
        const pattern = buildPatternFromFormat(format);
        if (!pattern) continue;

        const match = cleanedMsg.match(pattern);
        if (!match?.groups) continue;

        const senderRaw = String(match.groups.username ?? "").trim();
        const parsedMessage = String(match.groups.message ?? "").trim();
        if (!senderRaw || !parsedMessage) continue;

        const possibleUsername = parseUsername(senderRaw, bot);
        if (bot.players[possibleUsername]) {
            return { player: possibleUsername, message: parsedMessage };
        }
    }

    return null;
}
