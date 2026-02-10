import forestBotAPI from 'forestbot-api-wrapper-v2/build/wrapper.js';
import axios from "axios";
import { config } from '../config.js';
import Bot from '../structure/mineflayer/Bot.js';

const TOP_LIMIT = 5;
const BACKFILL_CONCURRENCY = 12;
const HISTORICAL_CACHE_TTL_MS = 15 * 60 * 1000;
const historicalTopCache = new Map<string, { expiresAt: number; data: any[] }>();

function formatTopChat<T>(title: string, rows: T[], formatter: (row: T) => string): string {
    return ` [${title}]: ${rows.map(formatter).join(", ")}`;
}

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
                const currentIndex = index++;
                if (currentIndex >= items.length) break;
                results[currentIndex] = await worker(items[currentIndex]);
            }
        })
    );

    return results;
}

async function getAllKnownUsernames(api: forestBotAPI, bot: Bot): Promise<string[]> {
    const users = await api.getUniqueUsers(bot.mc_server);
    if (!users || users.length === 0) return [];

    return Array.from(
        new Set(
            users
                .map((entry) => entry.username)
                .filter((name): name is string => Boolean(name))
        )
    );
}

async function getTopMessagesHistorical(api: forestBotAPI, bot: Bot): Promise<{ username: string; messages: number }[]> {
    const usernames = await getAllKnownUsernames(api, bot);
    const messageCounts = await runWithConcurrency(usernames, BACKFILL_CONCURRENCY, async (username) => {
        const data = await api.getMessageCount(username, bot.mc_server);
        if (!data || typeof data.count !== "number") return null;
        return { username, messages: data.count };
    });

    return messageCounts
        .filter((row): row is { username: string; messages: number } => row !== null)
        .sort((a, b) => b.messages - a.messages)
        .slice(0, TOP_LIMIT);
}

async function getTopAdvancementsHistorical(api: forestBotAPI, bot: Bot): Promise<{ username: string; advancements: number }[]> {
    const usernames = await getAllKnownUsernames(api, bot);
    const uuidCache = new Map<string, string>();
    const advancementCounts = await runWithConcurrency(usernames, BACKFILL_CONCURRENCY, async (username) => {
        let uuid = uuidCache.get(username);
        if (!uuid) {
            uuid = await api.convertUsernameToUuid(username) ?? undefined;
            if (!uuid) return null;
            uuidCache.set(username, uuid);
        }

        const totalAdvancements = await api.getTotalAdvancementsCount(uuid, bot.mc_server);
        if (typeof totalAdvancements !== "number") return null;
        return { username, advancements: totalAdvancements };
    });

    return advancementCounts
        .filter((row): row is { username: string; advancements: number } => row !== null)
        .sort((a, b) => b.advancements - a.advancements)
        .slice(0, TOP_LIMIT);
}

function getHistoricalCache<T>(server: string, metric: string): T[] | null {
    const key = `${server}:${metric}`;
    const cached = historicalTopCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
        historicalTopCache.delete(key);
        return null;
    }
    return cached.data as T[];
}

function setHistoricalCache<T>(server: string, metric: string, data: T[]): void {
    historicalTopCache.set(`${server}:${metric}`, {
        expiresAt: Date.now() + HISTORICAL_CACHE_TTL_MS,
        data
    });
}

async function getTopAdvancementsFromLeaderboards(api: forestBotAPI, bot: Bot): Promise<{ username: string; advancements: number }[] | null> {
    try {
        const response = await axios.get(`${api.apiurl}/leaderboards`, {
            params: { server: bot.mc_server }
        });
        const rows = response?.data?.advancements;
        if (!Array.isArray(rows) || rows.length === 0) return null;

        const parsed = rows
            .map((row: any) => ({
                username: row.player_name,
                advancements: Number(row.advancement_count)
            }))
            .filter((row: { username: string; advancements: number }) => Boolean(row.username) && Number.isFinite(row.advancements))
            .slice(0, TOP_LIMIT);

        return parsed.length > 0 ? parsed : null;
    } catch {
        return null;
    }
}

export default {
    commands: ['top'],
    description: ` Shows the top 5 players in a certain statistic. Usage: ${config.prefix}top <kills/deaths/joins/playtime/advancements/messages>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: forestBotAPI) => {
        if (!args[0]) return 
        
        const choice: string = args[0].toLowerCase();

        try {
            switch (choice) {
                case 'kills':
                    const Kills: string[] | number[] = (await api.getTopStatistic("kills", bot.mc_server, 5)).top_stat;
                    const stringKills: string = Kills.map((element: any) => `${element.username}: ${element.kills}`).join(", ");
                    bot.bot.chat(` [TOP KILLS]: ${stringKills}`);
                    break;
                case 'deaths':
                    const Deaths: string[] | number[] = (await api.getTopStatistic("deaths", bot.mc_server, 5)).top_stat;
                    const stringDeaths: string = Deaths.map((element: any) => `${element.username}: ${element.deaths}`).join(", ");
                    bot.bot.chat(` [TOP DEATHS]: ${stringDeaths}`);
                    break;
                case 'joins':
                    const Joins: string[] | number[] = (await api.getTopStatistic("joins", bot.mc_server, 5)).top_stat;
                    const stringJoins: string = Joins.map((element: any) => `${element.username}: ${element.joins}`).join(", ");
                    bot.bot.chat(` [TOP JOINS/LEAVES]: ${stringJoins}`);
                    break;
                case 'playtime':
                    const Playtime: string[] | number[] = (await api.getTopStatistic("playtime", bot.mc_server, 5)).top_stat;
                    const stringPlaytime: string = Playtime.map((element: any) => `${element.username}: ${Math.floor(element.playtime / (1000 * 60 * 60 * 24))} Days`).join(", ");
                    bot.bot.chat(` [TOP PLAYTIME]: ${stringPlaytime}`);
                    break;
                case 'advancements':
                    const leaderboardAdvancements = await getTopAdvancementsFromLeaderboards(api, bot);
                    if (leaderboardAdvancements?.length) {
                        bot.bot.chat(formatTopChat("TOP ADVANCEMENTS", leaderboardAdvancements, (entry) => `${entry.username}: ${entry.advancements}`));
                        break;
                    }

                    let historicalAdvancements = getHistoricalCache<{ username: string; advancements: number }>(bot.mc_server, "advancements");
                    if (!historicalAdvancements) {
                        bot.Whisper(user, "Running historical backfill for top advancements...");
                        historicalAdvancements = await getTopAdvancementsHistorical(api, bot);
                        if (historicalAdvancements.length > 0) {
                            setHistoricalCache(bot.mc_server, "advancements", historicalAdvancements);
                        }
                    }

                    if (historicalAdvancements.length === 0) {
                        bot.Whisper(user, "Could not calculate top advancements right now.");
                        break;
                    }
                    bot.bot.chat(formatTopChat("TOP ADVANCEMENTS", historicalAdvancements, (entry) => `${entry.username}: ${entry.advancements}`));
                    break;
                case 'messages':
                    let historicalMessages = getHistoricalCache<{ username: string; messages: number }>(bot.mc_server, "messages");
                    if (!historicalMessages) {
                        bot.Whisper(user, "Running historical backfill for top messages...");
                        historicalMessages = await getTopMessagesHistorical(api, bot);
                        if (historicalMessages.length > 0) {
                            setHistoricalCache(bot.mc_server, "messages", historicalMessages);
                        }
                    }

                    if (historicalMessages.length === 0) {
                        bot.Whisper(user, "Could not calculate top messages right now.");
                        break;
                    }
                    bot.bot.chat(formatTopChat("TOP MESSAGES", historicalMessages, (entry) => `${entry.username}: ${entry.messages}`));
                    break;
                default:
                    return;
            }
        } catch (err) {
            return bot.Whisper(user, "Api error");
        }


    }
} as MCommand
