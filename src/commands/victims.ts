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
    commands: ['victims', 'murders', 'bested'],
    description: ` Shows how many unique players a user has killed. Usage: ${config.prefix}victims <username>`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[0] ? args[0] : user;

        const uuid = await api.convertUsernameToUuid(search);
        const data = await api.getKills(uuid, config.mc_server, 10000, 'DESC');

        if (!data || data.length === 0) {
            if (search === user) {
                bot.Whisper(user, ` You have no kills, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` ${search} has no kills, or unexpected error occurred.`);
            }
            return;
        }

        const victims = new Set<string>();
        for (const entry of data) {
            const victim = extractVictimName(entry);
            if (!victim) continue;
            if (victim.toLowerCase() === search.toLowerCase()) continue;
            victims.add(victim.toLowerCase());
        }

        if (victims.size === 0) {
            if (search === user) {
                bot.Whisper(user, ` I couldn't determine your unique victims, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` I couldn't determine ${search}'s unique victims, or unexpected error occurred.`);
            }
            return;
        }

        const count = victims.size;
        bot.bot.chat(` ${search} has killed ${count} unique player${count === 1 ? '' : 's'}.`);
    }
} as MCommand
