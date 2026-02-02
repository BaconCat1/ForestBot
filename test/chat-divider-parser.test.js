import test from "node:test";
import assert from "node:assert/strict";
import { parseChatDividerMessage } from "../build/structure/mineflayer/utils/chatDividerParser.js";

const fakeBot = {
  players: {
    Fwuffian: { displayName: "Fwuffian" },
    Alice: { displayName: "[VIP] Alice" },
  },
};

test("parses clan + name with divider", () => {
  const msg = `FCHOA Fwuffian \u00bb there seem to be a few withers at spawn.`;
  const parsed = parseChatDividerMessage(msg, fakeBot);
  assert.deepEqual(parsed, {
    player: "Fwuffian",
    message: "there seem to be a few withers at spawn.",
  });
});

test("parses divider without spaces", () => {
  const msg = "Fwuffian> hello";
  const parsed = parseChatDividerMessage(msg, fakeBot);
  assert.deepEqual(parsed, { player: "Fwuffian", message: "hello" });
});

test("returns null for unknown player", () => {
  const msg = `Unknown \u00bb hi`;
  const parsed = parseChatDividerMessage(msg, fakeBot);
  assert.equal(parsed, null);
});
