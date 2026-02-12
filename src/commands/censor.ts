import { config } from "../config.js";
import type Bot from "../structure/mineflayer/Bot.js";
import { addBadWord, removeBadWord } from "../structure/mineflayer/utils/profanityFilter.js";

export default {
    commands: ["censor"],
    description: `Manage bad-words list. Usage: ${config.prefix}censor add <word> | ${config.prefix}censor remove <word>`,
    minArgs: 2,
    maxArgs: 50,
    whitelisted: true,
    execute: async (user: string, args: string[], bot: Bot) => {
        const action = String(args[0] ?? "").toLowerCase();
        const word = args.slice(1).join(" ").trim();

        if (!word) {
            bot.Whisper(user, ` Usage: ${config.prefix}censor add <word> | ${config.prefix}censor remove <word>`);
            return;
        }

        if (action === "add") {
            const added = await addBadWord(word);
            bot.Whisper(user, added ? ` Added "${word}" to bad words.` : ` "${word}" is already in bad words or invalid.`);
            return;
        }

        if (action === "remove" || action === "delete" || action === "rm") {
            const removed = await removeBadWord(word);
            bot.Whisper(user, removed ? ` Removed "${word}" from bad words.` : ` "${word}" was not found in bad words.`);
            return;
        }

        bot.Whisper(user, ` Usage: ${config.prefix}censor add <word> | ${config.prefix}censor remove <word>`);
    }
} as MCommand;

