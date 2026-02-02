import { config } from "../config.js";
import { QUOTE_SERVERS } from "../constants/quoteServers.js";

const MAX_MESSAGE_LENGTH = 230;
const CONTINUATION_PREFIX = "More: ";

const buildServerChunks = (servers: string[]): string[] => {
    const introPrefix = `Quotable servers (${servers.length}): `;
    const chunks: string[] = [];
    let current = introPrefix;
    let hasServerInChunk = false;

    for (const server of servers) {
        const separator = hasServerInChunk ? ", " : "";
        const next = `${current}${separator}${server}`;

        if (next.length > MAX_MESSAGE_LENGTH) {
            chunks.push(current);
            current = `${CONTINUATION_PREFIX}${server}`;
            hasServerInChunk = true;
            continue;
        }

        current = next;
        hasServerInChunk = true;
    }

    if (current.length > 0) {
        chunks.push(current);
    }

    return chunks;
};

export default {
    commands: ["lq", "listquoteservers"],
    description: ` Lists servers you can quote from. Usage: ${config.prefix}lq `,
    minArgs: 0,
    maxArgs: 0,
    execute: async (user, _args, bot) => {
        const servers = ["all", ...QUOTE_SERVERS];
        const chunks = buildServerChunks(servers);

        if (chunks.length === 1) {
            return bot.bot.chat(` ${chunks[0]}`);
        }

        for (const chunk of chunks) {
            bot.Whisper(user, ` ${chunk}`);
        }
    }
} as MCommand;
