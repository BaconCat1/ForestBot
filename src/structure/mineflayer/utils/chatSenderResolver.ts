import type { Bot } from "mineflayer";

function normalizeUuid(value: string): string {
    return String(value ?? "").replace(/-/g, "").toLowerCase();
}

export function resolvePlayerUsernameFromSenderUuid(bot: Bot, senderUuid: string | null | undefined): string | null {
    const normalizedSenderUuid = normalizeUuid(senderUuid ?? "");
    if (!normalizedSenderUuid) return null;

    for (const [username, player] of Object.entries(bot.players ?? {})) {
        if (normalizeUuid((player as { uuid?: string }).uuid ?? "") === normalizedSenderUuid) {
            return username;
        }
    }

    return null;
}
