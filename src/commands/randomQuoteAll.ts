import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from "../config.js";
import time from "../functions/utils/time.js";
import { QUOTE_SERVERS } from "../constants/quoteServers.js";

const shuffleServers = (servers: string[]): string[] => {
    for (let i = servers.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [servers[i], servers[j]] = [servers[j], servers[i]];
    }
    return servers;
};

export default {
    commands: ["rqa", "randomquoteall"],
    description: ` Retrieves a random quote from all servers. Usage: ${config.prefix}rqa <phrase>(optional)`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot, api: ForestBotAPI) => {
        const phrase = args[0];
        const servers = shuffleServers([...QUOTE_SERVERS]);

        let data: Awaited<ReturnType<typeof api.getQuote>> | null = null;
        let resolvedServer = "";

        for (const server of servers) {
            const result = await api.getQuote(
                "none",
                server,
                phrase ? { random: true, phrase } : { random: true }
            );

            if (result && result.message) {
                data = result;
                resolvedServer = server;
                break;
            }
        }

        if (!data || !data.message) {
            bot.Whisper(user, ` unexpected error occurred.`);
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
