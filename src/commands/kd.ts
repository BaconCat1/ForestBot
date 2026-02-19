import type { ForestBotAPI} from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import Bot from '../structure/mineflayer/Bot.js';
import { formatServerLabel, formatServerScopeHint, parseStatsTargetArgs } from "./utils/statsTarget.js";

export default {
    commands: ['kd', 'kills', 'deaths'],
    description: ` Displays the kill/death ratio of a user. Usage: ${config.prefix}kd <username> or ${config.prefix}kd <server|all> <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const target = parseStatsTargetArgs(args, user, bot.mc_server);
        if (!target.ok) {
            if (target.error.code === "missing-username-for-all") {
                bot.Whisper(user, ` Usage: ${config.prefix}kd all <username>`);
                return;
            }
            if (target.error.code === "unknown-server") {
                bot.Whisper(user, ` Unknown server "${target.error.server}". Use ${config.prefix}lq for the list.`);
                return;
            }
            bot.Whisper(user, ` Usage: ${config.prefix}kd <server|all> <username>`);
            return;
        }

        const search = target.search;
        const uuid = await api.convertUsernameToUuid(search)
        const data = await api.getKd(uuid, target.server);
        const serverHint = formatServerScopeHint(target.hasServerArg, target.server, bot.mc_server);
        if (!data) {
            if (search === user) {
                bot.Whisper(user, ` You have no kills or deaths${serverHint}, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` ${search} has no kills or deaths${serverHint}, or unexpected error occurred.`);
            }
            return;
        }

        const kdRatio = data.kills / data.deaths;
        const serverLabel = formatServerLabel(target.server, bot.mc_server);
        return bot.bot.chat(` ${search}${serverLabel}: Kills: ${data.kills} Deaths: ${data.deaths} KD: ${kdRatio.toFixed(2)}`);
    }
} as MCommand
