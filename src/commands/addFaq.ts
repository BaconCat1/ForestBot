import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";
import { censorBadWords } from "../structure/mineflayer/utils/profanityFilter.js";

export default {
    commands: ['addfaq'],
    description: `Adds a new FAQ entry. Usage: ${config.prefix}addfaq <text>`,
    minArgs: 0,
    maxArgs: 255,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {

        const uuid = await api.convertUsernameToUuid(user);

        if (args.some(arg => arg.includes('/'))) return bot.bot.whisper(user, "You can't use '/' in your FAQ.");

        if (!args || args.length === 0) return bot.bot.whisper(user, "Add a FAQ with !addfaq <text>");
        try {
            const rawFaq = args.join(" ");
            const sanitizedFaq = censorBadWords(rawFaq);
            const data = await api.postNewFaq(user, sanitizedFaq, uuid, bot.mc_server);

            if (!data) {
                bot.Whisper(user, " An error occurred while adding your FAQ.");
                return;
            }

            if (data.error) {
                bot.Whisper(user, data.error);
                return;
            }

            if (rawFaq !== sanitizedFaq) {
                bot.Whisper(user, " Some words were censored before storing your FAQ.");
            }
            bot.Whisper(user, ` Your FAQ has been added. Your entry ID is ${data.id}.`);
            return

        } catch (err) {
            bot.Whisper(user, " An error occurred while adding your FAQ.");
            return;
        }
    }

} as MCommand
