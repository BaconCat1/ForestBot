import type Bot from "../../structure/mineflayer/Bot.js"
import { Logger } from "../../index.js";

export default {
    name: "login",
    on: true,
    run: async (args: [], Bot: Bot) => {
        Logger.login(`Connected to ${Bot.options.host} successfully`);
    }
}
