//make the getFaq command, lets see what you got copilot!
import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import Bot from '../structure/mineflayer/Bot.js';
import { tryConsumeGlobalQuoteCooldown } from "./utils/quoteCooldown.js";

export default {
    commands: ['faq', 'getfaq'],
    description: ` Retrieves a FAQ entry by ID. Usage: ${config.prefix}faq <id>(optional)`,
    minArgs: 1,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const cooldown = tryConsumeGlobalQuoteCooldown();
        if (!cooldown.ok) {
            bot.Whisper(user, ` This command is on cooldown. Try again in ${cooldown.remainingSeconds}s.`);
            return;
        }

        const id = args[0];
        
        try {
            const data = await api.getFaq(id, bot.mc_server);
            if (!data) return bot.Whisper(user, ` There was an error getting your FAQ, it may not exist.`);
            bot.bot.chat(` #${data.id}/${data.total}: ${data.faq}`);
            return
        } catch {
            return

        }
    }
} as MCommand
