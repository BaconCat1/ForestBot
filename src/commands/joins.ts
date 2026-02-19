import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import type Bot from '../structure/mineflayer/Bot.js';
import { config } from '../config.js';
import { formatServerLabel, formatServerScopeHint, parseStatsTargetArgs } from "./utils/statsTarget.js";

export default {
    commands: ['joins'],
    description: ` Shows the number of times a user has joined. Usage: ${config.prefix}joins <username> or ${config.prefix}joins <server|all> <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const target = parseStatsTargetArgs(args, user, bot.mc_server);
        if (!target.ok) {
            if (target.error.code === "missing-username-for-all") {
                bot.Whisper(user, ` Usage: ${config.prefix}joins all <username>`);
                return;
            }
            if (target.error.code === "unknown-server") {
                bot.Whisper(user, ` Unknown server "${target.error.server}". Use ${config.prefix}lq for the list.`);
                return;
            }
            bot.Whisper(user, ` Usage: ${config.prefix}joins <server|all> <username>`);
            return;
        }

        const search = target.search;
        const uuid = await api.convertUsernameToUuid(search)
        const data = await api.getJoinCount(uuid, target.server);
        const serverHint = formatServerScopeHint(target.hasServerArg, target.server, bot.mc_server);

        if (!data || !data.joincount) {
            if (search === user) {
                bot.Whisper(user, ` You have no joins${serverHint}, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` ${search} has no joins${serverHint}, or unexpected error occurred.`);
            }
            return;
        }

        const serverLabel = formatServerLabel(target.server, bot.mc_server);
        return bot.bot.chat(` ${search}${serverLabel} has joined the server ${data.joincount} times`);
    }
} as MCommand
