import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlayerUsernameFromSenderUuid } from "../build/structure/mineflayer/utils/chatSenderResolver.js";

const fakeBot = {
  players: {
    Skull_v4mp: { uuid: "12345678-1234-1234-1234-1234567890ab" },
    AVITVS: { uuid: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  },
};

test("resolves sender uuid with dashes", () => {
  const username = resolvePlayerUsernameFromSenderUuid(fakeBot, "123456781234123412341234567890ab");
  assert.equal(username, "Skull_v4mp");
});

test("resolves sender uuid without dashes against dashed player uuid", () => {
  const username = resolvePlayerUsernameFromSenderUuid(fakeBot, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  assert.equal(username, "AVITVS");
});

test("returns null for unknown sender uuid", () => {
  const username = resolvePlayerUsernameFromSenderUuid(fakeBot, "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  assert.equal(username, null);
});

test("returns null for empty sender uuid", () => {
  const username = resolvePlayerUsernameFromSenderUuid(fakeBot, "");
  assert.equal(username, null);
});
