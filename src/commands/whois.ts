import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from '../config.js';
import Bot from "../structure/mineflayer/Bot.js";

const noUserFoundError = "No user found";
type ApiError = { response?: { status?: number; data?: { error?: string } } };

export default {
    commands: ['whois'],
    description: ` Shows the description of a user. Usage: ${config.prefix}whois <username>`,
    minArgs: 0,
    maxArgs: 255,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const search = args[0] ? args[0] : user;
        const safeUsername = String(search).match(/^[A-Za-z0-9_]{1,16}$/) ? String(search) : null;

        if (!safeUsername) {
            bot.Whisper(user, " Invalid username. Use a valid Minecraft name.");
            return;
        }

        let data;
        try {
            data = await api.getWhoIs(safeUsername);
        } catch (error) {
            const response = (error as ApiError).response;
            const responseError = response?.data?.error;

            if (response?.status === 400 && typeof responseError === "string" && responseError.includes(noUserFoundError)) {
                bot.Whisper(user, "User not found.");
                return;
            }

            console.warn(`Failed to fetch whois data for ${safeUsername}:`, error);
            data = null;
        }

        const notSetMessage = safeUsername === user
            ? ` You have not yet set a description with !iam`
            : ` ${safeUsername} has not yet set a description with !iam`;

        if (!data) {
            return bot.Whisper(user, notSetMessage);
        }

        const safeDescription = String(data.description ?? "")
            .replace(/[\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (!safeDescription) {
            return bot.Whisper(user, notSetMessage);
        }

        bot.bot.chat(`User ${safeUsername} is ${safeDescription}`)

        return;
    }
} as MCommand
