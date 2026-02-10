import type Bot from "../Bot";
import { config } from "../../../config.js";
import { Logger, api } from "../../../index.js";

export default async function mcCommandHandler(
    user: string,
    message: string,
    bot: Bot,
    uuid: string,
    replyAsWhisper: boolean = false
): Promise<void> {
    if (!config.useCommands) return;

    const commandPrefix = config.prefix;
    const [command, ...args] = message.trim().split(" ");

    if (user === bot.bot.username) return; // Ignore commands from itself
    // Find matching command
    const matchedCommand = Array.from(bot.commands.values()).find(cmd =>
        cmd.commands.some(alias => command.toLowerCase() === `${commandPrefix}${alias}`)
    );

    if (!matchedCommand) return; // No valid command found

    // Check if command is disabled
    if (config.commands.hasOwnProperty(command) && !config.commands[command]) {
        return;
    }

    if (matchedCommand.whitelisted && !bot.userWhitelist.has(uuid)) {
        bot.Whisper(user, `Sorry, ${user}, you are not allowed to use this command.`);
        return;
    }

    Logger.command(user, message);

    try {
        if (!replyAsWhisper) {
            await matchedCommand.execute(user, args, bot, api);
            return;
        }

        const botForWhisperReply = Object.create(bot) as Bot;
        const mineflayerBotForWhisperReply = Object.create(bot.bot) as typeof bot.bot;
        mineflayerBotForWhisperReply.chat = (outgoingMessage: string) => {
            bot.Whisper(user, outgoingMessage);
        };
        botForWhisperReply.bot = mineflayerBotForWhisperReply;

        await matchedCommand.execute(user, args, botForWhisperReply, api);
    } catch (error) {
        Logger.warn(`Command failed (${command}) for ${user}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
