import { config } from "../config.js";
import type Bot from "../structure/mineflayer/Bot.js";
import { addWordWhitelist, removeWordWhitelist } from "../structure/mineflayer/utils/profanityFilter.js";

export default {
    commands: ["wordwhitelist", "wwl"],
    description: `Manage always-allowed words. Usage: ${config.prefix}wordwhitelist add <word> | ${config.prefix}wordwhitelist remove <word>`,
    minArgs: 2,
    maxArgs: 50,
    whitelisted: true,
    execute: async (user: string, args: string[], bot: Bot) => {
        const action = String(args[0] ?? "").toLowerCase();
        const word = args.slice(1).join(" ").trim();

        if (!word) {
            bot.Whisper(user, ` Usage: ${config.prefix}wordwhitelist add <word> | ${config.prefix}wordwhitelist remove <word>`);
            return;
        }

        if (action === "add") {
            const added = await addWordWhitelist(word);
            bot.Whisper(user, added ? ` Added "${word}" to word whitelist.` : ` "${word}" is already whitelisted or invalid.`);
            return;
        }

        if (action === "remove" || action === "delete" || action === "rm") {
            const removed = await removeWordWhitelist(word);
            bot.Whisper(user, removed ? ` Removed "${word}" from word whitelist.` : ` "${word}" was not found in word whitelist.`);
            return;
        }

        bot.Whisper(user, ` Usage: ${config.prefix}wordwhitelist add <word> | ${config.prefix}wordwhitelist remove <word>`);
    }
} as MCommand;
