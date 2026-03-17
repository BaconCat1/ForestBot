import test from "node:test";
import assert from "node:assert/strict";
import {
  addWordWhitelist,
  censorBadWords,
  hasBadWords,
  removeWordWhitelist,
} from "../build/structure/mineflayer/utils/profanityFilter.js";

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

test("censors dotted and separated obfuscations", () => {
  assert.equal(censorBadWords("f.u.c.k"), "f.*.*.*");
  assert.equal(hasBadWords("s.h.i.t"), true);
});

test("censors leetspeak and symbol substitutions", () => {
  assert.equal(censorBadWords("sh!t b!tch"), "s*** b****");
  assert.equal(hasBadWords("b!tch"), true);
});

test("censors symbol-only bypass attempts", () => {
  assert.equal(censorBadWords("@$$"), "@**");
  assert.equal(hasBadWords("@$$"), true);
});

test("censors split-by-space bypasses", () => {
  assert.equal(censorBadWords("as shole"), "a* *****");
  assert.equal(censorBadWords("f uck"), "f ***");
  assert.equal(censorBadWords("f u c k"), "f * * *");
  assert.equal(hasBadWords("as shole"), true);
  assert.equal(hasBadWords("f uck"), true);
});

test("censors close misspellings of severe slurs", () => {
  assert.equal(censorBadWords("niggr"), "n****");
  assert.equal(hasBadWords("niggr"), true);
  assert.equal(censorBadWords("NlGGER"), "N*****");
  assert.equal(censorBadWords("N1GGER"), "N*****");
  assert.equal(censorBadWords("N5GGER"), "N*****");
  assert.equal(censorBadWords("N3GGER"), "N*****");
  assert.equal(censorBadWords("N0GGER"), "N*****");
  assert.equal(hasBadWords("NlGGER"), true);
  assert.equal(hasBadWords("N1GGER"), true);
  assert.equal(hasBadWords("N5GGER"), true);
  assert.equal(hasBadWords("N3GGER"), true);
  assert.equal(hasBadWords("N0GGER"), true);
});

test("censors username tokens that embed bad words", () => {
  assert.equal(censorBadWords("Player xxN1GGERxx joined"), "Player x********* joined");
  assert.equal(censorBadWords("User as_shole_123"), "User a*_*****_***");
  assert.equal(hasBadWords("xxN1GGERxx"), true);
  assert.equal(hasBadWords("as_shole_123"), true);
});

test("censors concatenated severe words in one token", () => {
  assert.equal(censorBadWords("iamaniggerbitch"), "i**************");
  assert.equal(hasBadWords("iamaniggerbitch"), true);
});

test("censors severe slurs embedded inside long noisy tokens", () => {
  const input = "testestees12873892!@#!@nigger###gsadfdsatest";
  const output = censorBadWords(input);
  assert.equal(hasBadWords(input), true);
  assert.ok(!output.toLowerCase().includes("nigger"));
  assert.equal(output[0], "t");
});

test("does not over-censor benign long words", () => {
  assert.equal(censorBadWords("assessment"), "assessment");
  assert.equal(hasBadWords("assessment"), false);
});

test("censors concatenated bad words with leetspeak", () => {
  assert.equal(hasBadWords("FUCKY0UB1TCH"), true);
  assert.equal(hasBadWords("fucky0ubitch"), true);
  assert.equal(hasBadWords("FUCKYOUBITCH"), true);
  assert.equal(hasBadWords("fuckbitch"), true);
  assert.equal(hasBadWords("shitfuck"), true);
  assert.equal(hasBadWords("bitchass"), true);
  const censored = censorBadWords("FUCKY0UB1TCH");
  assert.ok(!censored.toLowerCase().includes("fuck"));
  assert.ok(!censored.toLowerCase().includes("bitch"));
});

test("censors emoji character substitutions", () => {
  assert.equal(hasBadWords("sh💩t"), true);
  assert.equal(hasBadWords("sh🅸️t"), true);
  assert.equal(hasBadWords("f★ck"), true);
  assert.equal(hasBadWords("b👁tch"), true);
  const censored1 = censorBadWords("sh💩t");
  assert.ok(censored1.includes("*"));
  const censored2 = censorBadWords("f★ck");
  assert.ok(censored2.includes("*"));
});

test("censors Unicode confusable character substitutions", () => {
  assert.equal(hasBadWords("shıt"), true);
  assert.equal(hasBadWords("fμck"), true);
  assert.equal(hasBadWords("f∪ck"), true);
  assert.equal(hasBadWords("bıtch"), true);
  assert.equal(hasBadWords("А$$"), true); // Cyrillic capital A
  assert.equal(hasBadWords("Ѕhіt"), true); // Cyrillic lookalikes
  const censored = censorBadWords("shıt");
  assert.ok(censored.includes("*"));
});

test("censors circled letter bypasses", () => {
  assert.equal(hasBadWords("ⓝⓘⓖⓖⓔⓡ"), true);
  assert.equal(hasBadWords("ⓕⓤⓒⓚ"), true);
  assert.equal(hasBadWords("ⒷⒾⓉⒸⓗ"), true);
  assert.equal(hasBadWords("ⓢⓗⓘⓣ"), true);
  const censored1 = censorBadWords("ⓝⓘⓖⓖⓔⓡ");
  assert.ok(censored1.includes("*"));
  const censored2 = censorBadWords("ⓕⓤⓒⓚ");
  assert.ok(censored2.includes("*"));
});

test("censors Cherokee letter bypasses", () => {
  assert.equal(hasBadWords("Ꭰick"), true);
  assert.equal(hasBadWords("ꭰick"), true);
  assert.equal(hasBadWords("ꭰⓘⓒⓚ"), true);
  const censored = censorBadWords("Ꭰick");
  assert.ok(censored.includes("*"));
});

test("whitelisted words override censoring", async () => {
  await addWordWhitelist("fuck");

  try {
    assert.equal(censorBadWords("fuck"), "fuck");
    assert.equal(hasBadWords("fuck"), false);
  } finally {
    await removeWordWhitelist("fuck");
  }
});

test("replaces non-standard special characters with boxes", () => {
  assert.equal(censorBadWords("hello § Ω ™ world!"), "hello □ □ □ world!");
});

test("preserves allowed robot emoji output", () => {
  assert.equal(censorBadWords("hello 🤖"), "hello 🤖");
});
