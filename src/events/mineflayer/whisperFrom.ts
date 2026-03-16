import { BotEvents } from 'mineflayer';
import type Bot from '../../structure/mineflayer/Bot.js';
import { api } from '../../index.js';
import mcCommandHandler from '../../structure/mineflayer/utils/commandHandler.js';
import { config } from '../../config.js';
import { isSelfStandingCommand } from '../../structure/mineflayer/utils/isStandingCommand.js';

export default {
    name: 'chat:whisperFrom',
    once: false,
    run: async (args: any[], Bot: Bot) => {
        const content: BotEvents = args[0];
        const user = String(content[0]?.[0] ?? "").trim();
        const message = String(content[0]?.[1] ?? "").trim();
        if (!user || !message || !message.startsWith(config.prefix)) return;

        const uuid = Bot.bot.players[user]?.uuid ?? await api.convertUsernameToUuid(user);
        if (Bot.userBlacklist.has(uuid) && !isSelfStandingCommand(message)) return;

        await mcCommandHandler(user, message, Bot, uuid, true);
        return;
    }
};
