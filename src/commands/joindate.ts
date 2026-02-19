import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import time from "../functions/utils/time.js";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";
import { formatServerLabel, formatServerScopeHint, parseStatsTargetArgs } from "./utils/statsTarget.js";

export default {
    commands: ['joindate', 'jd', 'firstseen'],
    description: ` Retrieves the join date of a user. Usage: ${config.prefix}joindate <username> or ${config.prefix}joindate <server|all> <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const target = parseStatsTargetArgs(args, user, bot.mc_server);
        if (!target.ok) {
            if (target.error.code === "missing-username-for-all") {
                bot.Whisper(user, ` Usage: ${config.prefix}joindate all <username>`);
                return;
            }
            if (target.error.code === "unknown-server") {
                bot.Whisper(user, ` Unknown server "${target.error.server}". Use ${config.prefix}lq for the list.`);
                return;
            }
            bot.Whisper(user, ` Usage: ${config.prefix}joindate <server|all> <username>`);
            return;
        }

        const search = target.search;
        const uuid = await api.convertUsernameToUuid(search)
        const data = await api.getJoindate(uuid, target.server);
        const serverHint = formatServerScopeHint(target.hasServerArg, target.server, bot.mc_server);

        if (!data || !data.joindate) {
            if (search === user) {
                bot.Whisper(user, ` You have no join date${serverHint}, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` ${search} has no join date${serverHint}, or unexpected error occurred.`);
            }
            return;
        }

        let jd: string;

        // Check if `joindate` is a number (timestamp) or a plain string
        if (/^\d+$/.test(data.joindate as string)) {
            // If it’s only digits, assume it's a timestamp
            jd = time.convertUnixTimestamp(parseInt(data.joindate as string) / 1000);
        } else {
            // If it's not only digits, treat `joindate` as a plain string
            jd = data.joindate as string;
        }

        const serverLabel = formatServerLabel(target.server, bot.mc_server);
        bot.bot.chat(` ${search}${serverLabel}, joined on: ${jd}`);

    }
} as MCommand
