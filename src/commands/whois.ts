import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";

export default {
    commands: ['whois'],
    description: ` Shows the description of a user. Usage: ${config.prefix}whois <username>`,
    minArgs: 0,
    maxArgs: 255,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[0] ? args[0] : user;
        const safeUsername = String(search).match(/^[A-Za-z0-9_]{1,16}$/) ? String(search) : null;

        if (!safeUsername) {
            bot.Whisper(user, " Invalid username. Use a valid Minecraft name.");
            return;
        }

        const data = await api.getWhoIs(safeUsername);

        if (!data) {
            if (safeUsername === user) return bot.Whisper(user, ` You have not yet set a description with !iam`)
            else {
                return bot.Whisper(user, ` ${safeUsername} has not yet set a description with !iam`)
            }
            
        }

        const safeDescription = String(data.description ?? "")
            .replace(/[\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        bot.bot.chat(`User ${safeUsername} is ${safeDescription}`)

        return;
    }
} as MCommand
