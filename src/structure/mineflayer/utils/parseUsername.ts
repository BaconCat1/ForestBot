import type { Bot } from "mineflayer";
import { stripMinecraftFormatting } from "./stripMinecraftFormatting.js";

export default function parseUsername(name: string, bot: Bot): string {
    const normalizeToken = (value: string): string => {
        let token = stripMinecraftFormatting(value ?? "").trim();
        // If a clan/prefix is present, take the last token (usernames have no spaces)
        if (/\s/.test(token)) {
            const parts = token.split(/\s+/);
            token = parts[parts.length - 1] ?? "";
        }

        token = token.replace(/^<|>$/g, "").replace(/:$/, "");
        // remove everything except word chars, underscores, numbers
        token = token.replace(/[^_\w\d]/g, "");
        return token;
    };

    const cleanedName = normalizeToken(name);

    // if exact match in player list, return early
    if (cleanedName && bot.players[cleanedName]) {
        return cleanedName;
    }

    // try to resolve real username
    for (const user of Object.keys(bot.players)) {
        const displayNameRaw = bot.players[user].displayName?.toString() ?? user;
        const displayName = normalizeToken(displayNameRaw);

        // strict equality check, not includes
        if (cleanedName === displayName || cleanedName === user) {
            return user;
        }
    }

    // fallback
    return cleanedName;
}
