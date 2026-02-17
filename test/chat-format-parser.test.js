import test from "node:test";
import assert from "node:assert/strict";
import { parseConfiguredChatFormatMessage } from "../build/structure/mineflayer/utils/chatFormatParser.js";

function makeBot(players) {
  return { players };
}

test("custom format parser is disabled by default", () => {
  const bot = makeBot({
    Steve: { uuid: "u1", displayName: "Steve" },
  });

  const parsed = parseConfiguredChatFormatMessage("<Steve> hello", bot, {
    useCustomChatFormatParser: false,
    customChatFormats: ["<{username}> {message}"],
  });

  assert.equal(parsed, null);
});

test("custom format parser extracts username/message", () => {
  const bot = makeBot({
    Steve: { uuid: "u1", displayName: "Steve" },
  });

  const parsed = parseConfiguredChatFormatMessage("[VIP] Steve >> hello world", bot, {
    useCustomChatFormatParser: true,
    customChatFormats: ["[{skip}] {username} >> {message}"],
  });

  assert.deepEqual(parsed, { player: "Steve", message: "hello world" });
});

test("custom format parser ignores unknown users", () => {
  const bot = makeBot({
    Alex: { uuid: "u1", displayName: "Alex" },
  });

  const parsed = parseConfiguredChatFormatMessage("<Steve> hello", bot, {
    useCustomChatFormatParser: true,
    customChatFormats: ["<{username}> {message}"],
  });

  assert.equal(parsed, null);
});
