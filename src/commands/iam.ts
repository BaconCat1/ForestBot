import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';

export default {
    commands: ['iam'],
    description: ` Use ${config.prefix}iam to set your ${config.prefix}whois description.`,
    minArgs: 0,
    maxArgs: 255,
    execute: async (user, args, bot, api: ForestBotAPI) => {
        if (!args || args.length === 0) return bot.bot.whisper(user, " View descriptions with !whois or set one with !iam");

        const rawDescription = args
            .join(" ")
            .replace(/[\r\n\t]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const description = rawDescription;

        if (!description) {
            return bot.Whisper(user, " Please provide a description.");
        }

        // Keep chat output safe and avoid slash-command injection from stored text.
        if (description.includes("/")) {
            return bot.Whisper(user, " Descriptions cannot contain '/'.");
        }

        try {
            await api.postWhoIsDescription(user, description);
            bot.Whisper(user, ` your !whois has been set.`);
            return
        } catch {
            bot.Whisper(user, " Failed to save your description. Try a shorter/simpler message.");
            return;
        }
    }
} as MCommand
