import type { ForestBotAPI } from "forestbot-api-wrapper-v2"; 
import { config } from '../config.js';
import { formatServerLabel, formatServerScopeHint, parseStatsTargetArgs } from "./utils/statsTarget.js";

export default {
    commands: ['advancements', 'totaladvancements', 'advs', 'adv'],
    description: ` Retrives the number of advancements a user has. Usage: ${config.prefix}advs <username> or ${config.prefix}advs <server|all> <username>`,
    minArgs: 0,
    maxArgs: 2,
    execute: async (user, args, bot, api: ForestBotAPI) => {
        const target = parseStatsTargetArgs(args, user, bot.mc_server);
        if (!target.ok) {
            if (target.error.code === "missing-username-for-all") {
                bot.Whisper(user, ` Usage: ${config.prefix}advs all <username>`);
                return;
            }
            if (target.error.code === "unknown-server") {
                bot.Whisper(user, ` Unknown server "${target.error.server}". Use ${config.prefix}lq for the list.`);
                return;
            }
            bot.Whisper(user, ` Usage: ${config.prefix}advs <server|all> <username>`);
            return;
        }

        const search = target.search;
        const uuid = await api.convertUsernameToUuid(search)
        const data = await api.getTotalAdvancementsCount(uuid, target.server);
        const serverHint = formatServerScopeHint(target.hasServerArg, target.server, bot.mc_server);
 
        if (!data || data == undefined) {
            if (search === user) {
                bot.Whisper(user, ` I have not seen any advancements from you${serverHint}, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` I have not seen any advancements from ${search}${serverHint}, or unexpected error occurred.`);
            }
            return
        }

        const serverLabel = formatServerLabel(target.server, bot.mc_server);
        return bot.bot.chat(` I have seen ${data} advancements from ${search}${serverLabel}`);
        
    }
} as MCommand
