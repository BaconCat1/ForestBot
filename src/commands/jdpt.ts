import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import time from "../functions/utils/time.js";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";

export default {
    commands: ['jdpt', 'ptjd', 'joindateplaytime', 'playtimejoindate'],
    description: ` Retrieves join date and total playtime. Usage: ${config.prefix}jdpt <username>`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[0] ? args[0] : user;

        const uuid = await api.convertUsernameToUuid(search);
        const [jdData, ptData] = await Promise.all([
            api.getJoindate(uuid, config.mc_server),
            api.getPlaytime(uuid, bot.mc_server)
        ]);

        const hasJoinDate = Boolean(jdData && jdData.joindate);
        const hasPlaytime = Boolean(ptData && ptData.playtime);

        if (!hasJoinDate && !hasPlaytime) {
            if (search === user) {
                bot.Whisper(user, ` I have no join date or playtime recorded for you, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` I have no join date or playtime recorded for ${search}, or unexpected error occurred.`);
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

        bot.bot.chat(` ${search}, ${parts.join(" | ")}`);
    }
} as MCommand
