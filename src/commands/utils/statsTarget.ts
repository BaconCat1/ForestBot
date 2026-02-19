import { QUOTE_SERVER_SET, type QuoteServer } from "../../constants/quoteServers.js";

export type StatsTargetParseError =
    | { code: "missing-username-for-all" }
    | { code: "missing-username" }
    | { code: "unknown-server"; server: string };

export type StatsTargetParseResult =
    | {
          ok: true;
          server: string;
          search: string;
          hasServerArg: boolean;
          error?: never;
      }
    | {
          ok: false;
          error: StatsTargetParseError;
          server?: never;
          search?: never;
          hasServerArg?: never;
      };

const isQuoteServer = (value: string): value is QuoteServer =>
    QUOTE_SERVER_SET.has(value as QuoteServer);

export const parseStatsTargetArgs = (
    args: string[],
    user: string,
    defaultServer: string
): StatsTargetParseResult => {
    if (args.length === 0) {
        return { ok: true, server: defaultServer, search: user, hasServerArg: false };
    }

    if (args.length === 1) {
        const singleArg = String(args[0]).trim();
        if (singleArg.toLowerCase() === "all") {
            return { ok: false, error: { code: "missing-username-for-all" } };
        }

        return { ok: true, server: defaultServer, search: singleArg, hasServerArg: false };
    }

    const server = String(args[0]).trim().toLowerCase();
    const search = String(args[1] ?? "").trim();

    if (!search) {
        return { ok: false, error: { code: "missing-username" } };
    }

    if (server !== "all" && !isQuoteServer(server)) {
        return { ok: false, error: { code: "unknown-server", server } };
    }

    return { ok: true, server, search, hasServerArg: true };
};

export const formatServerLabel = (resolvedServer: string, defaultServer: string): string =>
    resolvedServer !== defaultServer ? ` [${resolvedServer}]` : "";

export const formatServerScopeHint = (
    hasServerArg: boolean,
    resolvedServer: string,
    defaultServer: string
): string => {
    if (!hasServerArg) return "";
    if (resolvedServer === "all") return " on all servers";
    if (resolvedServer === defaultServer) return "";
    return ` on ${resolvedServer}`;
};
