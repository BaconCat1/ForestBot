

// need to check if the user has even joine dthe server before by searching the api for some stat with the username,
// or by trying to find the uuid.


//make the getFaq command, lets see what you got copilot!
import type { ForestBotAPI } from 'forestbot-api-wrapper-v2';
import { config } from '../config.js';
import Bot from '../structure/mineflayer/Bot.js';
import { readFile, writeFile } from 'fs/promises';
import { censorBadWords } from '../structure/mineflayer/utils/profanityFilter.js';

export default {
    commands: ["offlinemsg"],
    description: ` Store a message to be delivered when the player next comes online. ${config.prefix}offlinemsg <username> <message> `,
    minArgs: 1,
    maxArgs: 1,
    execute: async (user, args, bot: Bot, api: ForestBotAPI) => {
        const userToSendMessageTo = args[0];
        const rawMessage = args.slice(1).join(" ");
        const message = censorBadWords(rawMessage);

        try {

            // check if user is offlinemsging themselves
            if (user === userToSendMessageTo) {
                return bot.Whisper(user, ` You can't send a message to yourself, sorry.`);
            }

            // check if msg is over 250 characters
            if (message.length > 250) {
                return bot.Whisper(user, ` Message is too long, must be less than 250 characters.`);
            }

            if (rawMessage !== message) {
                bot.Whisper(user, " Some words were censored before storing your offline message.");
            }

            // check if user isonline first
            if (bot.bot.players[userToSendMessageTo]) {
                return bot.Whisper(user, ` User ${userToSendMessageTo} is online, please send them a message directly.`);
            }

            // check if user is in the database
            const uuid = await api.convertUsernameToUuid(userToSendMessageTo);
            if (!uuid) {
                return bot.Whisper(user, ` User ${userToSendMessageTo} is not in the database.`);
            }

            // get a timestamp in milliseconds unix
            const timestamp = Date.now();

            // lets load the json file 
            const offlineMessages: OfflineMessage[] = (await JSON.parse(await readFile("./json/offline_messages.json", "utf-8")));
            if (!offlineMessages) {
                return bot.Whisper(user, ` There was an error loading the offline messages.`);
            }

            console.log(offlineMessages)

            let recipientsMsgCount = 0;
            for (const message of offlineMessages) {
                if (message.recipient === userToSendMessageTo) {
                    recipientsMsgCount++;
                }
            }

            if (recipientsMsgCount >= 5) {
                return bot.Whisper(user, ` User ${userToSendMessageTo} has too many offline messages pending...`);
            }

            // add the message to the array
            offlineMessages.push({
                sender: user,
                recipient: userToSendMessageTo,
                message: message,
                timestamp: timestamp
            });

            // write the array back to the file
            await writeFile("./json/offline_messages.json", JSON.stringify(offlineMessages, null, 2));

            return bot.Whisper(user, ` Your message has been saved and will be delivered to ${userToSendMessageTo} when they are next online.`);

        } catch (err) {
            console.error(err);
            return bot.Whisper(user, ` There was an error saving your message for ${userToSendMessageTo}.`);
        }
    }
} as MCommand
