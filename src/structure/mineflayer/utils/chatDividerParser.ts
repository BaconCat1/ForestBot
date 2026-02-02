import type { Bot } from "mineflayer";
import parseUsername from "./parseUsername.js";
import { stripMinecraftFormatting } from "./stripMinecraftFormatting.js";

const dividerPattern = /^(.*?)\s*(?:\u00bb|>>|>)\s*(.+)$/;

export function parseChatDividerMessage(fullMsg: string, bot: Bot): { player: string; message: string } | null {
    const cleanedMsg = stripMinecraftFormatting(fullMsg).replace(/\u00c2\u00bb/g, "\u00bb");
    const match = cleanedMsg.match(dividerPattern);
    if (!match) return null;

    const senderRaw = match[1].trim();
    const message = match[2].trim();
    const possibleUsername = parseUsername(senderRaw, bot);
    if (bot.players[possibleUsername]) {
        return { player: possibleUsername, message };
    }

    return null;
}
