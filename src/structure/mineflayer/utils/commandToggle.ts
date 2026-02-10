import { config } from "../../../config.js";

function getCommandsConfig(): Record<string, unknown> {
    if (!config || typeof config !== "object") return {};
    const raw = (config as any).commands;
    if (!raw || typeof raw !== "object") return {};
    return raw as Record<string, unknown>;
}

function normalizeKey(key: string): string {
    return String(key || "")
        .trim()
        .replace(/^!/, "")
        .toLowerCase();
}

function readToggleValue(commandsConfig: Record<string, unknown>, alias: string): boolean | undefined {
    const normalized = normalizeKey(alias);
    if (!normalized) return undefined;

    const direct = commandsConfig[normalized];
    if (typeof direct === "boolean") return direct;

    const prefixed = commandsConfig[`${config.prefix}${normalized}`];
    if (typeof prefixed === "boolean") return prefixed;

    return undefined;
}

export function isCommandEnabled(command: MCommand, invokedAlias?: string): boolean {
    const commandsConfig = getCommandsConfig();
    const aliases = new Set<string>();

    if (invokedAlias) aliases.add(invokedAlias);
    for (const alias of command.commands ?? []) aliases.add(alias);

    let sawTrue = false;
    let sawAnyExplicit = false;

    for (const alias of aliases) {
        const value = readToggleValue(commandsConfig, alias);
        if (value === undefined) continue;
        sawAnyExplicit = true;
        if (value === false) return false;
        sawTrue = true;
    }

    if (!sawAnyExplicit) return true;
    return sawTrue;
}

