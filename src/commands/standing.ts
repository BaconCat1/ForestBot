import { config } from "../config.js";
import type Bot from "../structure/mineflayer/Bot.js";

export default {
    commands: ["standing", "status"],
    description: ` Shows blacklist/regular/whitelist status. Usage: ${config.prefix}standing <username>(optional)`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api) => {
        const requesterUuid = bot.bot.players[user]?.uuid ?? await api.convertUsernameToUuid(user);
        const requesterIsBlacklisted = requesterUuid ? bot.userBlacklist.has(requesterUuid) : false;
        const target = args[0]?.trim() ? String(args[0]).trim() : user;

        if (requesterIsBlacklisted && target.toLowerCase() !== user.toLowerCase()) {
            bot.Whisper(user, " You can only check your own standing.");
            return;
        }

        const targetUuid = target.toLowerCase() === user.toLowerCase()
            ? requesterUuid
            : bot.bot.players[target]?.uuid ?? await api.convertUsernameToUuid(target);

        if (!targetUuid) {
            bot.bot.chat(` ${target} is regular.`);
            return;
        }

        const status = bot.userBlacklist.has(targetUuid)
            ? "blacklisted"
            : bot.userWhitelist.has(targetUuid)
                ? "whitelisted"
                : "regular";

        bot.bot.chat(` ${target} is ${status}.`);
    }
} as MCommand;
