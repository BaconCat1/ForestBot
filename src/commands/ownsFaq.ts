import type { ForestBotAPI } from "forestbot-api-wrapper-v2";
import { config } from "../config.js";
import Bot from "../structure/mineflayer/Bot.js";

export default {
    commands: ["ownsfaq", "ownfaq", "faqowner"],
    description: `Says the owner of a FAQ in public chat. Usage: ${config.prefix}ownsfaq <id>`,
    minArgs: 1,
    maxArgs: 1,
    execute: async (user: string, args: string[], bot: Bot, api: ForestBotAPI) => {
        const id = String(args[0] ?? "").trim();
        if (!id || Number.isNaN(Number(id))) {
            bot.Whisper(user, ` Usage: ${config.prefix}ownsfaq <id>`);
            return;
        }

        const data = await api.getFaq(id, bot.mc_server);
        if (!data) {
            bot.Whisper(user, ` Could not find FAQ #${id}.`);
            return;
        }

        bot.bot.chat(` FAQ #${data.id} owner: ${data.username}`);
    }
} as MCommand;
