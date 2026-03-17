import forestBotAPI from 'forestbot-api-wrapper-v2/build/wrapper.js';
import { config } from '../config.js';
import Bot from '../structure/mineflayer/Bot.js';

const ACTIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const ACTIVE_TOP_LIMIT = 5;
const ACTIVE_MSG_FETCH = 100;
const CONCURRENCY = 12;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const activeCache = new Map<string, { expiresAt: number; data: { username: string; count: number }[] }>();

async function runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<R>
): Promise<R[]> {
    const safeLimit = Math.max(1, Math.min(limit, items.length || 1));
    const results: R[] = new Array(items.length);
    let index = 0;

    await Promise.all(
        Array.from({ length: safeLimit }, async () => {
            while (true) {
                const i = index++;
                if (i >= items.length) break;
                results[i] = await worker(items[i]);
            }
        })
    );

    return results;
}

async function computeActive(
    api: forestBotAPI,
    bot: Bot
): Promise<{ username: string; count: number }[]> {
    const users = await api.getUniqueUsers(bot.mc_server);
    if (!users || users.length === 0) return [];

    const usernames = Array.from(
        new Set(users.map(u => u.username).filter((n): n is string => Boolean(n)))
    );

    const cutoff = Date.now() - ONE_DAY_MS;

    const counts = await runWithConcurrency(usernames, CONCURRENCY, async (username) => {
        const messages = await api.getMessages(username, bot.mc_server, ACTIVE_MSG_FETCH, 'DESC');
        if (!messages || messages.length === 0) return { username, count: 0 };

        let count = 0;
        for (const msg of messages) {
            const ts = parseInt(msg.date, 10);
            if (ts >= cutoff) {
                count++;
            } else {
                break; // DESC order — past this point all messages are older
            }
        }
        return { username, count };
    });

    return counts
        .filter((row): row is { username: string; count: number } => row !== null && row.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, ACTIVE_TOP_LIMIT);
}

export default {
    commands: ['active'],
    description: ` Shows the most active players in the last 24 hours by message count. Usage: ${config.prefix}active`,
    minArgs: 0,
    maxArgs: 0,
    execute: async (user, args, bot: Bot, api: forestBotAPI) => {
        const key = bot.mc_server;
        const cached = activeCache.get(key);

        if (cached && Date.now() < cached.expiresAt) {
            if (cached.data.length === 0) {
                bot.Whisper(user, ` No players found active in the last 24 hours.`);
                return;
            }
            bot.bot.chat(` [ACTIVE 24h]: ${cached.data.map(r => `${r.username}: ${r.count}`).join(', ')}`);
            return;
        }

        bot.Whisper(user, ` Computing active players, this may take a moment...`);
        const rows = await computeActive(api, bot);

        activeCache.set(key, { expiresAt: Date.now() + ACTIVE_CACHE_TTL_MS, data: rows });

        if (rows.length === 0) {
            bot.Whisper(user, ` No players found active in the last 24 hours.`);
            return;
        }

        bot.bot.chat(` [ACTIVE 24h]: ${rows.map(r => `${r.username}: ${r.count}`).join(', ')}`);
    }
} as MCommand
