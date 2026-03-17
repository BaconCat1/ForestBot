import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import type Bot from '../structure/mineflayer/Bot.js';

export default {
    commands: ['winrate', 'wr'],
    description: ` Shows a player's kill win rate: kills/(kills+deaths)%. Usage: ${config.prefix}winrate [username]`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[0] ? args[0] as string : user;
        const uuid = await api.convertUsernameToUuid(search);
        const data = await api.getKd(uuid, config.mc_server);

        if (!data) {
            if (search === user) {
                bot.Whisper(user, ` You have no kills or deaths recorded, or unexpected error occurred.`);
            } else {
                bot.Whisper(user, ` ${search} has no kills or deaths recorded, or unexpected error occurred.`);
            }
            return;
        }

        const total = data.kills + data.deaths;
        if (total === 0) {
            bot.Whisper(user, ` ${search} has no kills or deaths recorded.`);
            return;
        }

        const winrate = ((data.kills / total) * 100).toFixed(1);
        const deathrate = ((data.deaths / total) * 100).toFixed(1);
        bot.bot.chat(` ${search}: Win Rate: ${winrate}% | Death Rate: ${deathrate}% (${data.kills}K / ${data.deaths}D)`);
    }
} as MCommand
