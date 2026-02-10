import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from '../config.js';
import time from "../functions/utils/time.js";
import { QUOTE_SERVERS, QUOTE_SERVER_SET, type QuoteServer } from "../constants/quoteServers.js";

const QUOTE_COOLDOWN_MS = 10_000;
const quoteUserCooldowns = new Map<string, number>();

const isQuoteServer = (value: string): value is QuoteServer =>
    QUOTE_SERVER_SET.has(value as QuoteServer);

export default {
    commands: ['quote', 'q'],
    description: ` Retrieves a random quote from a user. Usage: ${config.prefix}quote <username>, ${config.prefix}quote <server> <username>, or ${config.prefix}quote all <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot, api: ForestBotAPI) => {
        const now = Date.now();
        const lastUsed = quoteUserCooldowns.get(user) ?? 0;
        const remainingMs = QUOTE_COOLDOWN_MS - (now - lastUsed);
        if (remainingMs > 0) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            bot.Whisper(user, ` You're using ${config.prefix}q too quickly. Try again in ${remainingSeconds}s.`);
            return;
        }
        quoteUserCooldowns.set(user, now);

        const serverArg = args[0] ? String(args[0]).toLowerCase() : "";
        const hasServerArg = args.length >= 2;
        const server = hasServerArg ? serverArg : config.mc_server;
        const search = hasServerArg ? args[1] : (args[0] ? args[0] : user);

        if (!hasServerArg && serverArg === "all") {
            bot.Whisper(user, ` Usage: ${config.prefix}quote all <username>`);
            return;
        }

        if (hasServerArg && (!search || String(search).trim().length === 0)) {
            bot.Whisper(user, ` Usage: ${config.prefix}quote <server> <username>`);
            return;
        }

        if (hasServerArg && server !== "all" && !isQuoteServer(server)) {
            bot.Whisper(user, ` Unknown server "${server}". Use ${config.prefix}lq for the list.`);
            return;
        }

        let data: Awaited<ReturnType<typeof api.getQuote>> | null = null;
        let resolvedServer = server;

        if (server === "all") {
            const servers = [...QUOTE_SERVERS];
            for (let i = servers.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [servers[i], servers[j]] = [servers[j], servers[i]];
            }

            for (const candidate of servers) {
                const result = await api.getQuote(search, candidate);
                if (result && result.message) {
                    data = result;
                    resolvedServer = candidate;
                    break;
                }
            }
        } else {
            data = await api.getQuote(search, server);
        }
     
        console.log(data, " quote dats")

        if (!data || !data.message) { 
            const serverHint = hasServerArg ? (server === "all" ? " on any server" : ` on ${server}`) : "";
            if (search === user) {
                bot.Whisper(user, ` I have no quotes recorded for you${serverHint}, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` I have no quotes recorded for ${search}${serverHint}, or unexpected error occurred.`);
            }
            return;
        }

        let date: string | undefined = undefined;

        // there is an error here we need to figure out
        
        if (!data.date) {
            date = ""
        }else {
            date = data.date
        }
    
        //check if date is a digit. 
        if (date && date.match(/^\d+$/)) { 
            //convert our timestamp to a human readable format
            date = time.timeAgoStr(parseInt(date));
        } else {
            date = ""
        }

        const serverLabel = resolvedServer !== config.mc_server ? ` [${resolvedServer}]` : '';
        return bot.bot.chat(` ${search}${serverLabel}: ${data.message} ${date ? `(${date})` : ''}`);
    }
} as MCommand
