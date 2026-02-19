import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import time from "../functions/utils/time.js";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";
import { formatServerLabel, formatServerScopeHint, parseStatsTargetArgs } from "./utils/statsTarget.js";

export default {
    commands: ['jdpt', 'ptjd', 'joindateplaytime', 'playtimejoindate'],
    description: ` Retrieves join date and total playtime. Usage: ${config.prefix}jdpt <username> or ${config.prefix}jdpt <server|all> <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const target = parseStatsTargetArgs(args, user, bot.mc_server);
        if (!target.ok) {
            if (target.error.code === "missing-username-for-all") {
                bot.Whisper(user, ` Usage: ${config.prefix}jdpt all <username>`);
                return;
            }
            if (target.error.code === "unknown-server") {
                bot.Whisper(user, ` Unknown server "${target.error.server}". Use ${config.prefix}lq for the list.`);
                return;
            }
            bot.Whisper(user, ` Usage: ${config.prefix}jdpt <server|all> <username>`);
            return;
        }

        const search = target.search;
        const uuid = await api.convertUsernameToUuid(search);
        const [jdData, ptData] = await Promise.all([
            api.getJoindate(uuid, target.server),
            api.getPlaytime(uuid, target.server)
        ]);
        const serverHint = formatServerScopeHint(target.hasServerArg, target.server, bot.mc_server);

        const hasJoinDate = Boolean(jdData && jdData.joindate);
        const hasPlaytime = Boolean(ptData && ptData.playtime);

        if (!hasJoinDate && !hasPlaytime) {
            if (search === user) {
                bot.Whisper(user, ` I have no join date or playtime recorded for you${serverHint}, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` I have no join date or playtime recorded for ${search}${serverHint}, or unexpected error occurred.`);
            }
            return;
        }

        let jd: string | null = null;
        if (hasJoinDate) {
            if (/^\d+$/.test(jdData.joindate as string)) {
                jd = time.convertUnixTimestamp(parseInt(jdData.joindate as string) / 1000);
            } else {
                jd = jdData.joindate as string;
            }
        }

        const playtime = hasPlaytime ? time.dhms(ptData.playtime) : null;

        const parts: string[] = [];
        if (jd) parts.push(`joined on: ${jd}`);
        if (playtime) parts.push(`total playtime: ${playtime}`);

        const serverLabel = formatServerLabel(target.server, bot.mc_server);
        bot.bot.chat(` ${search}${serverLabel}, ${parts.join(" | ")}`);
    }
} as MCommand
