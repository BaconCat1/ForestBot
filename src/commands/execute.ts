import { config } from "../config.js";
import type Bot from "../structure/mineflayer/Bot.js";

export default {
    commands: ["execute", "exec"],
    description: `Executes a raw server command as the bot. Usage: ${config.prefix}execute </command>`,
    minArgs: 1,
    maxArgs: 255,
    whitelisted: true,
    execute: async (user: string, args: string[], bot: Bot) => {
        const commandToRun = args.join(" ").trim();
        if (!commandToRun) {
            bot.Whisper(user, ` Usage: ${config.prefix}execute </command>`);
            return;
        }

        bot.bot.chat(commandToRun);
        bot.Whisper(user, ` Executed: ${commandToRun}`);
    }
} as MCommand;

