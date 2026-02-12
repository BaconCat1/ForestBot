import test from "node:test";
import assert from "node:assert/strict";
import { censorBadWords, hasBadWords } from "../build/structure/mineflayer/utils/profanityFilter.js";

test("censors listed bad words", () => {
  const input = "hello fuck world";
  assert.equal(censorBadWords(input), "hello f*** world");
});

test("never masks whole phrases, only bad words", () => {
  const input = "fuck shit bitch now";
  assert.equal(censorBadWords(input), "f*** s*** b**** now");
});

test("hasBadWords detects listed words", () => {
  assert.equal(hasBadWords("all good"), false);
  assert.equal(hasBadWords("this is shit"), true);
});

test("does not censor ambiguous/common words", () => {
  const input = "mc server fan settings and hell biome";
  assert.equal(censorBadWords(input), input);
  assert.equal(hasBadWords(input), false);
});

test("still censors explicit short profanity acronyms", () => {
  assert.equal(censorBadWords("stfu now"), "s*** now");
  assert.equal(hasBadWords("kys"), true);
});
