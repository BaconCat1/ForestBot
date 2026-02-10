import type Bot from "../structure/mineflayer/Bot.js";
import { config } from "../config.js";

export default {
    commands: ["reload", "reloadconfig"],
    description: ` Reloads config and whitelist/blacklist files. Usage: ${config.prefix}reload`,
    minArgs: 0,
    maxArgs: 0,
    whitelisted: true,
    execute: async (user, args, bot: Bot) => {
        await bot.loadConfigs();
        bot.Whisper(user, " Config reloaded.");
    }
} as MCommand;

