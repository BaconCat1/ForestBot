import type { Bot } from "mineflayer";

export default function parseUsername(name: string, bot: Bot): string {
    let cleanedName = name.trim();
    // If a clan/prefix is present, take the last token (usernames have no spaces)
    if (cleanedName.includes(" ")) {
        const parts = cleanedName.split(/\s+/);
        cleanedName = parts[parts.length - 1];
    }

    // remove everything except word chars, underscores, numbers
    cleanedName = cleanedName.replace(/[^_\w\d]/g, '');

    // remove leading "<" if present
    if (cleanedName.startsWith("<")) {
        cleanedName = cleanedName.slice(1);
    }

    // if exact match, return early
    if (bot.players[cleanedName] && cleanedName === bot.players[cleanedName].displayName.toString()) {
        return cleanedName;
    }

    // try to resolve real username
    for (const user of Object.keys(bot.players)) {
        let displayName = bot.players[user].displayName.toString();

        // handle case where display name has rank/prefix
        let displayNameSplit = displayName.split(" ");
        if (displayNameSplit.length >= 2) {
            displayName = displayNameSplit[1];
        }

        // strict equality check, not includes
        if (cleanedName === displayName || cleanedName === user) {
            return user;
        }
    }

    // fallback
    return cleanedName;
}
