import type { ForestBotAPI, MinecraftChatMessage } from "forestbot-api-wrapper-v2";
import { config } from "../config.js";
import type Bot from "../structure/mineflayer/Bot.js";
import { censorBadWords } from "../structure/mineflayer/utils/profanityFilter.js";

const SHOUT_COOLDOWN_MS = 10 * 60 * 1000;
let lastShoutAt = 0;

export default {
    commands: ["shout"],
    description: `Broadcasts a message to all connected Forest servers. Usage: ${config.prefix}shout <message>`,
    minArgs: 1,
    maxArgs: 255,
    whitelisted: true,
    execute: async (user: string, args: string[], bot: Bot, api: ForestBotAPI) => {
        const rawMessage = args.join(" ").trim();
        const message = censorBadWords(rawMessage).replace(/\//g, "").trim();
        if (!message) {
            bot.Whisper(user, ` Usage: ${config.prefix}shout <message>`);
            return;
        }

        const now = Date.now();
        const cooldownRemainingMs = SHOUT_COOLDOWN_MS - (now - lastShoutAt);
        if (cooldownRemainingMs > 0) {
            const remainingMinutes = Math.ceil(cooldownRemainingMs / 60000);
            bot.Whisper(user, ` Shout is on cooldown. Try again in ${remainingMinutes} minute(s).`);
            return;
        }

        const shoutText = `[Shout ${bot.mc_server}] ${user}: ${message}`;
        bot.bot.chat(shoutText);

        if (!api.websocket) {
            bot.Whisper(user, " Shout relay is unavailable right now (websocket disconnected).");
            return;
        }

        const payload = {
            action: "inbound_minecraft_chat",
            data: {
                name: user,
                message: shoutText,
                date: Date.now().toString(),
                mc_server: "all",
                uuid: "shout-relay",
                relay_type: "shout",
                origin_server: bot.mc_server,
                relay_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            }
        } as { action: "inbound_minecraft_chat"; data: MinecraftChatMessage & Record<string, unknown> };

        await api.websocket.sendMessage(payload);
        lastShoutAt = now;

        if (rawMessage !== message) {
            bot.Whisper(user, " Your shout was sanitized (bad words censored and '/' removed).");
        }
        bot.Whisper(user, ` Shout sent to connected servers.`);
    }
} as MCommand;
