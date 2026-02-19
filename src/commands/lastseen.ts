import time from '../functions/utils/time.js';
import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import Bot from '../structure/mineflayer/Bot.js';
import { formatServerLabel, formatServerScopeHint, parseStatsTargetArgs } from "./utils/statsTarget.js";

export default {
    commands: ['lastseen', 'seen', 'ls'],
    description: ` Displays the last time a user was seen online. Usage: ${config.prefix}lastseen <username> or ${config.prefix}lastseen <server|all> <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const target = parseStatsTargetArgs(args, user, bot.mc_server);
        if (!target.ok) {
            if (target.error.code === "missing-username-for-all") {
                bot.Whisper(user, ` Usage: ${config.prefix}lastseen all <username>`);
                return;
            }
            if (target.error.code === "unknown-server") {
                bot.Whisper(user, ` Unknown server "${target.error.server}". Use ${config.prefix}lq for the list.`);
                return;
            }
            bot.Whisper(user, ` Usage: ${config.prefix}lastseen <server|all> <username>`);
            return;
        }

        const search = target.search;
        const uuid = await api.convertUsernameToUuid(search)
        const data = await api.getLastSeen(uuid, target.server);
        const serverHint = formatServerScopeHint(target.hasServerArg, target.server, bot.mc_server);
        
        if (!data || !data.lastseen) {
            if (search === user) {
                bot.Whisper(user, ` You haven't been seen by me${serverHint}, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` ${search} has not been seen by me${serverHint}, or unexpected error occurred.`);
            }
            return;
        }

        const userIsOnline = target.server === bot.mc_server && bot.bot.players[search] ? true : false;
        const serverLabel = formatServerLabel(target.server, bot.mc_server);

        if (userIsOnline && (data && data.lastseen.toString().match(/^\d+$/))) {
            const unixTime = parseInt(data.lastseen.toString());
            const lastseen = time.timeAgoStr(unixTime);
            return bot.bot.chat(` ${search}${serverLabel} is playing right now and logged in ${lastseen}`);
        }

        let lastseenString: string;

        if (data && data.lastseen.toString().match(/^\d+$/)) {
            const timeAgo = time.timeAgoStr(parseInt(data.lastseen.toString()));
            lastseenString = `${time.convertUnixTimestamp(parseInt(data.lastseen.toString()) / 1000)} (${timeAgo})`;
        } else {
            lastseenString = data.lastseen.toString();
        }

        return bot.bot.chat(` I last saw ${search}${serverLabel} ${lastseenString}`);
    }
} as MCommand
