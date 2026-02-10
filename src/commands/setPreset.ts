import type Bot from '../structure/mineflayer/Bot.js';
import { config } from '../config.js';

function resolveServerChat(bot: Bot): (message: string) => void {
    const parentBot = Object.getPrototypeOf(bot) as Bot | undefined;
    if (parentBot?.bot?.chat) {
        return parentBot.bot.chat.bind(parentBot.bot);
    }
    return bot.bot.chat.bind(bot.bot);
}

export default {
    commands: ['setpreset'],
    description: ` Sets the namechalk preset, only on refinedvanilla. Usage: ${config.prefix}setPreset <preset> `,
    minArgs: 1,
    maxArgs: 1,
    whitelisted: false,
    execute: async (user, args, bot: Bot) => {
        const preset = args[0]?.trim();
        if (!preset) return;
        const chatToServer = resolveServerChat(bot);
        chatToServer(`/nc preset ${preset}`);
        bot.bot.chat(` Set the preset ${preset} successfully!`);
        return;
    }
} as MCommand
