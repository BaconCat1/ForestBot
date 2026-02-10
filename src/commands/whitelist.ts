import type Bot from "../structure/mineflayer/Bot.js";
import { config } from "../config.js";
import type { ForestBotAPI } from "forestbot-api-wrapper-v2";

export default {
    commands: ["whitelist"],
    description: ` Use ${config.prefix}whitelist add|remove to modify the command whitelist.`,
    minArgs: 1,
    maxArgs: 2,
    whitelisted: true,
    execute: async (user, args: string[], bot: Bot, api: ForestBotAPI) => {
        const action = String(args[0] ?? "").toLowerCase();
        if (action !== "add" && action !== "remove") {
            bot.Whisper(user, ` Invalid action. Use ${config.prefix}whitelist add|remove <username>.`);
            return;
        }

        const targetUsername = args[1];
        if (!targetUsername) {
            bot.Whisper(user, ` Please specify a user. Usage: ${config.prefix}whitelist ${action} <username>.`);
            return;
        }

        const uuid = bot.bot.players[targetUsername]?.uuid ?? await api.convertUsernameToUuid(targetUsername);
        if (!uuid) {
            bot.Whisper(user, ` Could not resolve UUID for ${targetUsername}.`);
            return;
        }

        await bot.updateLists(uuid, action, "whitelist");
        await bot.loadConfigs();

        if (action === "add") {
            bot.Whisper(user, ` Added ${targetUsername} to the whitelist.`);
        } else {
            bot.Whisper(user, ` Removed ${targetUsername} from the whitelist.`);
        }
    }
} as MCommand;

