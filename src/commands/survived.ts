import time from '../functions/utils/time.js';
import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import type Bot from '../structure/mineflayer/Bot.js';

function toEpochMs(value: string | number): number {
    const raw = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!Number.isFinite(raw)) return 0;
    return raw < 1_000_000_000_000 ? raw * 1000 : raw;
}

export default {
    commands: ['survived'],
    description: ` Shows how long since a user's last death. Usage: ${config.prefix}survived <username>`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[0] ? args[0] : user;
        const uuid = await api.convertUsernameToUuid(search);
        const data = await api.getDeaths(uuid, config.mc_server, 1, 'DESC', 'all');

        if (!data || data.length === 0) {
            if (search === user) {
                bot.Whisper(user, `You have no deaths, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, `${search} has no deaths, or unexpected error occurred.`);
            }
            return;
        }

        const deathTimeRaw = data[0]?.time;
        const deathTimeMs = toEpochMs(deathTimeRaw);
        if (!deathTimeMs) {
            bot.Whisper(user, `Unable to determine last death time for ${search}.`);
            return;
        }

        const durationMs = Math.max(0, Date.now() - deathTimeMs);
        const survived = time.dhms(durationMs).replace(/\.$/, "");

        bot.bot.chat(` ${search} has survived for ${survived} since their last death.`);
    }
} as MCommand
