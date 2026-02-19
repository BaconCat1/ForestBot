import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";
import { formatServerLabel } from "./utils/statsTarget.js";
import { QUOTE_SERVER_SET, type QuoteServer } from "../constants/quoteServers.js";

const isQuoteServer = (value: string): value is QuoteServer =>
    QUOTE_SERVER_SET.has(value as QuoteServer);

export default {
    commands: ['wordcount', 'words', 'count'],
    description: ` Shows the number of times a user has said a word. Usage: ${config.prefix}wordcount <username> <word> or ${config.prefix}wordcount <server|all> <username> <word>`,
    minArgs: 0,
    maxArgs: 3,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        let server = bot.mc_server;
        let search = "";
        let word = "";
        let hasServerArg = false;

        if (args.length >= 3) {
            hasServerArg = true;
            server = String(args[0]).toLowerCase();
            search = String(args[1]);
            word = String(args[2]);

            if (server !== "all" && !isQuoteServer(server)) {
                bot.Whisper(user, ` Unknown server "${server}". Use ${config.prefix}lq for the list.`);
                return;
            }
        } else {
            search = String(args[0] ?? "");
            word = String(args[1] ?? "");
        }

        if (!search || !word) {
            return bot.Whisper(user, ` Usage: ${config.prefix}wordcount <username> <word> or ${config.prefix}wordcount <server|all> <username> <word>`)
        }

        const data = await api.getWordOccurence(search, server, word);
        if (!data || data.count === undefined) {
            const serverHint = hasServerArg ? (server === "all" ? " on all servers" : ` on ${server}`) : "";
            return bot.Whisper(user, ` ${search} has not said ${word}${serverHint}`)
        }

        const serverLabel = formatServerLabel(server, bot.mc_server);
        bot.bot.chat(` ${search}${serverLabel} has said ${word} ${data.count} times`)

        return;

    }
} as MCommand
