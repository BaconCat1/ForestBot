export type ParsedWhisperMessage = {
    sender: string;
    recipient: string | null;
    message: string;
};

const whisperPatterns: Array<{
    direction: "from" | "to";
    regex: RegExp;
}> = [
    { direction: "from", regex: /^\[PM\]\s+(.+?)\s+\u2192\s+(.+?)\s+\u00bb\s+(.+)$/ },
    { direction: "from", regex: /^From:\s*([^ ]+)\s*\u00bb\s*(.+)$/ },
    { direction: "from", regex: /^\[MSG\]\s*([^ ]+)\s*->\s*me:\s*(.+)$/ },
    { direction: "from", regex: /^([^ ]+)\s+whispers to you:\s*(.+)$/ },
    { direction: "from", regex: /^\[([^ ]+)\s*->\s*me\]\s*(.+)$/ },
    { direction: "from", regex: /^([^ ]+)\s+whispers:\s*(.+)$/ },
    { direction: "from", regex: /^\[([^ ]+)\s*->\s*You\]\s*(.+)$/ },
    { direction: "to", regex: /^\[MSG\]\s*me\s*->\s*([^ ]+):\s*(.+)$/ },
    { direction: "to", regex: /^(?:To:|To)\s*([^ ]+)(?::|\s*\u00bb)\s*(.+)$/ },
    { direction: "to", regex: /^You whisper to\s+([^ ]+):\s*(.+)$/ },
    { direction: "to", regex: /^\[me\s*->\s*([^ ]+)\]\s*(.+)$/ },
    { direction: "to", regex: /^\[You\s*->\s*([^ ]+)\]\s*(.+)$/ },
];

export function parseWhisperMessage(
    rawMessage: string,
    botUsername?: string | null
): ParsedWhisperMessage | null {
    const message = String(rawMessage ?? "").trim();
    if (!message) return null;

    for (const pattern of whisperPatterns) {
        const match = message.match(pattern.regex);
        if (!match) continue;

        if (pattern.regex.source.startsWith("^\\[PM\\]")) {
            const sender = match[1].trim();
            const recipient = match[2].trim();
            const parsedMessage = match[3].trim();
            return { sender, recipient, message: parsedMessage };
        }

        const otherUser = match[1].trim();
        const parsedMessage = match[2].trim();

        if (pattern.direction === "from") {
            return {
                sender: otherUser,
                recipient: botUsername ? String(botUsername).trim() : null,
                message: parsedMessage,
            };
        }

        return {
            sender: botUsername ? String(botUsername).trim() : "",
            recipient: otherUser,
            message: parsedMessage,
        };
    }

    return null;
}
