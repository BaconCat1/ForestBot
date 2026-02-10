import { config } from "../../../config.js";

export default function isStandingCommand(message: string): boolean {
    const trimmed = String(message ?? "").trim().toLowerCase();
    if (!trimmed.startsWith(config.prefix)) return false;

    const firstToken = trimmed.split(/\s+/)[0];
    const alias = firstToken.slice(config.prefix.length);
    return alias === "standing";
}

