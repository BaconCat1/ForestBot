import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from "../config.js";
import time from "../functions/utils/time.js";
import { QUOTE_SERVERS } from "../constants/quoteServers.js";

const pickRandomServer = <T,>(servers: readonly T[]): T =>
    servers[Math.floor(Math.random() * servers.length)];

export default {
    commands: ["rqa", "randomquoteall"],
    description: ` Retrieves a random quote from all servers. Usage: ${config.prefix}rqa `,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot, api: ForestBotAPI) => {
        const phrase = args[0];
        const resolvedServer = pickRandomServer(QUOTE_SERVERS);
        const data = await api.getQuote(
            "none",
            resolvedServer,
            phrase ? { random: true, phrase } : { random: true }
        );

        if (!data || !data.message) {
            const phraseLabel = phrase ? ` for "${phrase}"` : "";
            bot.Whisper(user, ` No quotes found${phraseLabel} on ${resolvedServer}.`);
            return;
        }

        const date =
            data.date && /^\d+$/.test(data.date)
                ? time.timeAgoStr(Number(data.date))
                : "";

        return bot.bot.chat(
            ` Quote from ${data.name} [${resolvedServer}]: "${data.message}" ${date ? `(${date})` : ''}`
        );
    }
} as MCommand;
