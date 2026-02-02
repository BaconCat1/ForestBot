import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";

export default {
    commands: ['oldnames'],
    description: ` See a users name history! Usage: ${config.prefix}oldnames <username>`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {

        const userToSearch = args[0] || user;
        const profileUrl = `https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(userToSearch)}`;
        const profileResponse = await fetch(profileUrl);
        if (profileResponse.status === 404) {
            return bot.Whisper(user, ` Could not find the user you were looking for on the Ashcon API.`);
        }
        if (!profileResponse.ok) return bot.bot.chat(` An error occured while trying to look up the user.`);
        const profile = await profileResponse.json();
        const nameHistoryData = profile?.username_history;
        if (!Array.isArray(nameHistoryData) || nameHistoryData.length === 0) {
            return bot.bot.chat(` No name history was found for that user.`);
        }
        
        const nameHistory = nameHistoryData.map(entry => entry.username).filter(Boolean);
        const inappropriateNames = new Set(["1HateN1ggers", "ShriviledP3ck3r"]);
        const filteredHistory = nameHistory.filter((name) => !inappropriateNames.has(name));
    

        return bot.bot.chat(` ${userToSearch} has used the following names: ${filteredHistory.join(", ")}`);
    }
} as MCommand
