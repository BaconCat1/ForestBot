import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import type Bot from '../structure/mineflayer/Bot.js';

function extractVictimName(entry: any): string | null {
    const direct = entry?.victim ?? entry?.victim_name ?? entry?.victimUsername ?? entry?.victim_username;
    if (typeof direct === 'string' && direct.trim()) return direct.trim();

    const message = entry?.death_message ?? entry?.kill_message ?? entry?.message;
    if (typeof message === 'string' && message.trim()) {
        const first = message.trim().split(/\s+/)[0] ?? '';
        const cleaned = first.replace(/[^_\w\d]/g, '');
        return cleaned || null;
    }

    return null;
}

export default {
    commands: ['grudge'],
    description: ` Shows how many times a player has killed a specific victim. Usage: ${config.prefix}grudge [killer] <victim>`,
    minArgs: 1,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const killer = args[1] ? args[0] as string : user;
        const victim = args[1] ? args[1] as string : args[0] as string;

        const uuid = await api.convertUsernameToUuid(killer);
        const data = await api.getKills(uuid, config.mc_server, 10000, 'DESC');

        if (!data || data.length === 0) {
            bot.Whisper(user, ` ${killer} has no kills recorded, or unexpected error occurred.`);
            return;
        }

        let count = 0;
        for (const entry of data) {
            const v = extractVictimName(entry);
            if (v && v.toLowerCase() === victim.toLowerCase()) count++;
        }

        if (count === 0) {
            bot.bot.chat(` ${killer} has never killed ${victim}.`);
        } else if (count >= 30) {
            bot.bot.chat(` ${killer} has killed ${victim} ${count} times. That's a grudge!`);
        } else {
            bot.bot.chat(` ${killer} has killed ${victim} ${count} time${count === 1 ? '' : 's'}.`);
        }
    }
} as MCommand
