import type Bot from '../structure/mineflayer/Bot.js';
import forestBotAPI from 'forestbot-api-wrapper-v2/build/wrapper.js';
import { config } from '../config.js';

const MOUNT_GLOBAL_COOLDOWN_MS = 3000;
const MOUNT_USER_COOLDOWN_MS = 6000;
const MOUNT_NOTIFY_COOLDOWN_MS = 1500;

const mountUserCooldowns = new Map<string, number>();
const mountNotifyCooldowns = new Map<string, number>();
let mountInProgress = false;
let lastMountAttempt = 0;

export default {
    commands: ['mount', 'ride', 'mush'],
    description: `Mount the nearest rideable entity. Usage: ${config.prefix}mount <entity>(optional)`,
    minArgs: 0,
    maxArgs: 1,
    execute: async (user: string, args: any[], bot: Bot, api: typeof forestBotAPI): Promise<void> => {
        const normalizeName = (name: string) => name.replace(/^minecraft:/, "").toLowerCase();
        const now = Date.now();
        const notify = (message: string) => {
            const lastNotify = mountNotifyCooldowns.get(user) ?? 0;
            if (now - lastNotify < MOUNT_NOTIFY_COOLDOWN_MS) return;
            mountNotifyCooldowns.set(user, now);
            bot.bot.whisper(user, message);
        };

        if (mountInProgress || now - lastMountAttempt < MOUNT_GLOBAL_COOLDOWN_MS) {
            notify("Mounting is on cooldown. Try again in a moment.");
            return;
        }

        const lastUserAttempt = mountUserCooldowns.get(user) ?? 0;
        if (now - lastUserAttempt < MOUNT_USER_COOLDOWN_MS) {
            notify("You're using !mount too quickly. Try again in a moment.");
            return;
        }

        mountInProgress = true;
        lastMountAttempt = now;
        mountUserCooldowns.set(user, now);

        try {
            const targetName = args.length > 0 ? normalizeName(String(args[0])) : null;
            const mountableMobs = new Set([
                "camel",
                "donkey",
                "horse",
                "mule",
                "llama",
                "trader_llama",
                "pig",
                "strider",
                "skeleton_horse",
                "zombie_horse"
            ]);
            const mountableVehicles = new Set([
                "boat",
                "oak_boat",
                "spruce_boat",
                "birch_boat",
                "jungle_boat",
                "acacia_boat",
                "dark_oak_boat",
                "mangrove_boat",
                "cherry_boat",
                "oak_chest_boat",
                "spruce_chest_boat",
                "birch_chest_boat",
                "jungle_chest_boat",
                "acacia_chest_boat",
                "dark_oak_chest_boat",
                "mangrove_chest_boat",
                "cherry_chest_boat",
                "bamboo_raft",
                "bamboo_chest_raft",
                "minecart",
                "chest_minecart",
                "furnace_minecart",
                "hopper_minecart",
                "tnt_minecart",
                "command_block_minecart",
                "spawner_minecart"
            ]);

            const matchesTarget = (name: string, target: string | null): boolean => {
                if (!target) return true;
                if (name === target) return true;
                if (target === "boat") return name.endsWith("_boat") || name === "boat";
                if (target === "chest_boat") return name.endsWith("_chest_boat") || name === "chest_boat";
                if (target === "raft") return name.endsWith("_raft") || name === "raft";
                if (target === "chest_raft") return name.endsWith("_chest_raft") || name === "chest_raft";
                if (target === "minecart") return name.endsWith("_minecart") || name === "minecart";
                return false;
            };

            bot.bot.whisper(user, targetName ? `Searching for nearest ${targetName} to mount...` : "Searching for nearest mountable...");

            const entities = Object.values(bot.bot.entities);
            const candidates = entities.filter((entity: any) => {
                if (!entity?.position) return false;
                if (entity.id === bot.bot.entity?.id) return false;
                const name = normalizeName(entity.name ?? "");
                if (!matchesTarget(name, targetName)) return false;
                return entity.kind === "Vehicles" || mountableMobs.has(name) || mountableVehicles.has(name);
            });

            candidates.sort((a: any, b: any) => {
                const aDist = a.position.distanceTo(bot.bot.entity.position);
                const bDist = b.position.distanceTo(bot.bot.entity.position);
                return aDist - bDist;
            });

            if (candidates.length === 0) {
                bot.bot.whisper(user, targetName ? `I could not find a ${targetName} nearby.` : "I could not find any mountable nearby.");
                return;
            }

            const tryMount = async (entity: any): Promise<boolean> => {
                return new Promise((resolve) => {
                    let resolved = false;
                    const cleanup = () => {
                        if (resolved) return;
                        resolved = true;
                        bot.bot.removeListener("mount", onMount);
                        clearTimeout(timeoutId);
                    };
                    const onMount = () => {
                        cleanup();
                        resolve(true);
                    };
                    const timeoutId = setTimeout(() => {
                        cleanup();
                        resolve(false);
                    }, 1500);

                    bot.bot.once("mount", onMount);
                    try {
                        bot.bot.mount(entity);
                    } catch (err) {
                        cleanup();
                        resolve(false);
                    }
                });
            };

            for (const entity of candidates) {
                const mounted = await tryMount(entity);
                if (mounted) {
                    const name = normalizeName(entity.name ?? "entity");
                    bot.bot.whisper(user, `Mounted ${name}!`);
                    return;
                }
            }

            bot.bot.whisper(user, targetName
                ? `I found a ${targetName}, but couldn't mount it.`
                : "I found mountables nearby, but couldn't mount any of them.");
        } finally {
            mountInProgress = false;
        }
    }
} as MCommand;
