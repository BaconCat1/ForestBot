import type Bot from '../structure/mineflayer/Bot.js';
import { config } from '../config.js';

export default {
    commands: ['setpreset'],
    description: ` Sets the nc preset. Usage: ${config.prefix}setPreset <preset>`,
    minArgs: 1,
    maxArgs: 1,
    whitelisted: false,
    execute: async (user, args, bot: Bot) => {
        const preset = args[0]?.trim();
        if (!preset) return;
        bot.bot.chat(`/nc preset ${preset}`);
        bot.bot.chat(` Set the preset ${preset} successfully!`);
        return;
    }
} as MCommand
