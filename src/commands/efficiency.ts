import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import type Bot from '../structure/mineflayer/Bot.js';

const VALID_STATS = ['kills', 'deaths', 'messages'] as const;
type EffStat = typeof VALID_STATS[number];

function toEpochMs(value: string | number): number {
    const raw = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!Number.isFinite(raw)) return 0;
    return raw < 1_000_000_000_000 ? raw * 1000 : raw;
}

export default {
    commands: ['efficiency', 'eff'],
    description: ` Shows rate-based efficiency stats. Usage: ${config.prefix}efficiency [username] <kills|deaths|messages>`,
    minArgs: 1,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[1] ? args[0] as string : user;
        const statArg = args[1] ? args[1] : args[0];
        const stat = (statArg as string).toLowerCase() as EffStat;

        if (!VALID_STATS.includes(stat)) {
            bot.Whisper(user, ` Valid stats: kills, deaths, messages. Usage: ${config.prefix}efficiency [username] <stat>`);
            return;
        }

        const uuid = await api.convertUsernameToUuid(search);

        if (stat === 'kills' || stat === 'deaths') {
            const [kd, pt] = await Promise.all([
                api.getKd(uuid, config.mc_server),
                api.getPlaytime(uuid, config.mc_server),
            ]);

            if (!kd || !pt?.playtime) {
                bot.Whisper(user, ` Couldn't get stats for ${search}, or unexpected error occurred.`);
                return;
            }

            const hours = pt.playtime / (1000 * 60 * 60);
            if (hours === 0) {
                bot.Whisper(user, ` ${search} has no playtime recorded.`);
                return;
            }

            const count = stat === 'kills' ? kd.kills : kd.deaths;
            const rate = (count / hours).toFixed(3);
            const label = stat === 'kills' ? 'kills' : 'deaths';
            bot.bot.chat(` ${search}: ${count} ${label} over ${hours.toFixed(1)} hours = ${rate} ${label}/hr`);
        } else {
            const [mc, jd] = await Promise.all([
                api.getMessageCount(search, config.mc_server),
                api.getJoindate(uuid, config.mc_server),
            ]);

            if (!mc || mc.count == null || !jd?.joindate) {
                bot.Whisper(user, ` Couldn't get stats for ${search}, or unexpected error occurred.`);
                return;
            }

            const joindateMs = toEpochMs(jd.joindate as string | number);
            if (!joindateMs) {
                bot.Whisper(user, ` Couldn't determine join date for ${search}.`);
                return;
            }

            const daysSince = (Date.now() - joindateMs) / (1000 * 60 * 60 * 24);
            if (daysSince <= 0) {
                bot.Whisper(user, ` Couldn't calculate message rate for ${search}.`);
                return;
            }

            const rate = (mc.count / daysSince).toFixed(2);
            bot.bot.chat(` ${search}: ${mc.count} messages over ${Math.floor(daysSince)} days = ${rate} messages/day`);
        }
    }
} as MCommand
