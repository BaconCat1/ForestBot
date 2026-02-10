import { config } from "../config.js";
import type Bot from "../structure/mineflayer/Bot.js";

export default {
    commands: ["standing", "status"],
    description: ` Shows your status: blacklist, regular, or whitelist. Usage: ${config.prefix}standing`,
    minArgs: 0,
    maxArgs: 0,
    execute: async (user, args, bot: Bot, api) => {
        const uuid = bot.bot.players[user]?.uuid ?? await api.convertUsernameToUuid(user);
        if (!uuid) {
            bot.bot.chat(` ${user} is regular.`);
            return;
        }

        const status = bot.userBlacklist.has(uuid)
            ? "blacklist"
            : bot.userWhitelist.has(uuid)
                ? "whitelist"
                : "regular";

        bot.bot.chat(` ${user} is ${status}.`);
    }
} as MCommand;
