import time     from "../functions/utils/time.js";
import { config } from '../config.js';
import { ForestBotAPI } from "forestbot-api-wrapper-v2";
import Bot from "../structure/mineflayer/Bot.js";
import { formatServerLabel, formatServerScopeHint, parseStatsTargetArgs } from "./utils/statsTarget.js";

export default {
    commands: ['playtime', 'pt'],
    description: ` Retrieves the total playtime of a user. Usage: ${config.prefix}playtime <username> or ${config.prefix}playtime <server|all> <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot:Bot, api: ForestBotAPI) => {
        const target = parseStatsTargetArgs(args, user, bot.mc_server);
        if (!target.ok) {
            if (target.error.code === "missing-username-for-all") {
                bot.Whisper(user, ` Usage: ${config.prefix}playtime all <username>`);
                return;
            }
            if (target.error.code === "unknown-server") {
                bot.Whisper(user, ` Unknown server "${target.error.server}". Use ${config.prefix}lq for the list.`);
                return;
            }
            bot.Whisper(user, ` Usage: ${config.prefix}playtime <server|all> <username>`);
            return;
        }

        const search = target.search;
        const uuid = await api.convertUsernameToUuid(search)
        const data = await api.getPlaytime(uuid, target.server);
        const serverHint = formatServerScopeHint(target.hasServerArg, target.server, bot.mc_server);

        if (!data || !data.playtime) { 
            if (search === user) {
                bot.Whisper(user, ` I have no playtime recorded for you${serverHint}, or unexpected error occurred.`);
                return
            } else {
                bot.Whisper(user, ` I have no playtime recorded for ${search}${serverHint}, or unexpected error occurred.`);
                return
            }
        }

        const playtime = time.dhms(data.playtime);
        const serverLabel = formatServerLabel(target.server, bot.mc_server);
        return bot.bot.chat(` ${search}${serverLabel}'s total playtime is ${playtime}`)
    }
} as MCommand
