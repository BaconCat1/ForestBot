import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import time from '../functions/utils/time.js';
import { config } from '../config.js';
import type Bot from '../structure/mineflayer/Bot.js';

function toEpochMs(value: string | number): number {
    const raw = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!Number.isFinite(raw)) return 0;
    return raw < 1_000_000_000_000 ? raw * 1000 : raw;
}

export default {
    commands: ['summary', 'sum'],
    description: ` Single-line stats overview for a player. Usage: ${config.prefix}summary [username]`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[0] ? args[0] as string : user;
        const uuid = await api.convertUsernameToUuid(search);

        const [kd, pt, mc, adv, jd] = await Promise.all([
            api.getKd(uuid, config.mc_server),
            api.getPlaytime(uuid, config.mc_server),
            api.getMessageCount(search, config.mc_server),
            api.getTotalAdvancementsCount(uuid, config.mc_server),
            api.getJoindate(uuid, config.mc_server),
        ]);

        const kills = kd?.kills ?? 0;
        const deaths = kd?.deaths ?? 0;
        const kdr = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

        const ptDays = pt?.playtime ? Math.floor(pt.playtime / (1000 * 60 * 60 * 24)) : 0;
        const msgs = mc?.count ?? 0;
        const advCount = typeof adv === 'number' ? adv : 0;

        let age = '?';
        if (jd?.joindate) {
            const joindateMs = toEpochMs(jd.joindate as string | number);
            if (joindateMs) {
                const days = Math.floor((Date.now() - joindateMs) / (1000 * 60 * 60 * 24));
                age = `${days}d`;
            }
        }

        bot.bot.chat(
            ` [${search}] KD: ${kills}/${deaths} (${kdr}) |` +
            ` Playtime: ${ptDays}d |` +
            ` Messages: ${msgs} |` +
            ` Advancements: ${advCount} |` +
            ` Member for: ${age}`
        );
    }
} as MCommand
