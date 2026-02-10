import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from '../config.js';
import time from "../functions/utils/time.js";
import { tryConsumeGlobalQuoteCooldown } from "./utils/quoteCooldown.js";

export default {
    commands: ['rq', 'randomquote'],
    description: ` Retrieves a random quote. Usage: ${config.prefix}rq <phrase>(optional)`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot, api: ForestBotAPI) => {
        const cooldown = tryConsumeGlobalQuoteCooldown();
        if (!cooldown.ok) {
            bot.Whisper(user, ` Quote commands are on cooldown. Try again in ${cooldown.remainingSeconds}s.`);
            return;
        }

        const phrase = args[0];
        const data = await api.getQuote(
            "none",
            config.mc_server,
            phrase ? { random: true, phrase } : { random: true }
        );

        if (!data || !data.message) {
            bot.Whisper(user, ` unexpected error occurred.`);

            return;
        }

        const date =
            data.date && /^\d+$/.test(data.date)
                ? time.timeAgoStr(Number(data.date))
                : "";

        return bot.bot.chat(` Quote from ${data.name}: "${data.message}" ${date ? `(${date})` : ''}`);
    }
} as MCommand
