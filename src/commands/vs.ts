import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import type Bot from '../structure/mineflayer/Bot.js';

export default {
    commands: ['vs'],
    description: ` Head-to-head stat comparison between two players. Usage: ${config.prefix}vs <player1> <player2>`,
    minArgs: 2,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const name1 = args[0] as string;
        const name2 = args[1] as string;

        const [uuid1, uuid2] = await Promise.all([
            api.convertUsernameToUuid(name1),
            api.convertUsernameToUuid(name2),
        ]);

        const [kd1, kd2, pt1, pt2, mc1, mc2] = await Promise.all([
            api.getKd(uuid1, config.mc_server),
            api.getKd(uuid2, config.mc_server),
            api.getPlaytime(uuid1, config.mc_server),
            api.getPlaytime(uuid2, config.mc_server),
            api.getMessageCount(name1, config.mc_server),
            api.getMessageCount(name2, config.mc_server),
        ]);

        const kills1 = kd1?.kills ?? 0;
        const deaths1 = kd1?.deaths ?? 0;
        const kills2 = kd2?.kills ?? 0;
        const deaths2 = kd2?.deaths ?? 0;
        const kdr1 = deaths1 > 0 ? (kills1 / deaths1).toFixed(2) : kills1.toFixed(2);
        const kdr2 = deaths2 > 0 ? (kills2 / deaths2).toFixed(2) : kills2.toFixed(2);

        const ptDays1 = pt1?.playtime ? Math.floor(pt1.playtime / (1000 * 60 * 60 * 24)) : 0;
        const ptDays2 = pt2?.playtime ? Math.floor(pt2.playtime / (1000 * 60 * 60 * 24)) : 0;

        const msgs1 = mc1?.count ?? 0;
        const msgs2 = mc2?.count ?? 0;

        const w = (a: number, b: number) => a > b ? '>' : a < b ? '<' : '=';

        bot.bot.chat(
            ` [VS] ${name1} vs ${name2} |` +
            ` K: ${kills1} ${w(kills1, kills2)} ${kills2} |` +
            ` D: ${deaths1} ${w(deaths2, deaths1)} ${deaths2} |` +
            ` KD: ${kdr1} ${w(parseFloat(kdr1), parseFloat(kdr2))} ${kdr2} |` +
            ` PT: ${ptDays1}d ${w(ptDays1, ptDays2)} ${ptDays2}d |` +
            ` Msgs: ${msgs1} ${w(msgs1, msgs2)} ${msgs2}`
        );
    }
} as MCommand
