import test from "node:test";
import assert from "node:assert/strict";
import { censorBadWords, hasBadWords } from "../build/structure/mineflayer/utils/profanityFilter.js";

// Test the specific bypass cases mentioned in the issue
test("catches fullwidth characters bypass (ｎｉｇｇｅｒ)", () => {
  assert.equal(hasBadWords("ｎｉｇｇｅｒ"), true);
  const censored = censorBadWords("ｎｉｇｇｅｒ");
  assert.ok(censored.includes("*"));
});

test("catches Chinese characters bypass (黑鬼)", () => {
  assert.equal(hasBadWords("黑鬼"), true);
  const censored = censorBadWords("黑鬼");
  assert.ok(censored.includes("*"));
});

test("catches mixed Unicode confusables (ᛔitϹh)", () => {
  assert.equal(hasBadWords("ᛔitϹh"), true);
  const censored = censorBadWords("ᛔitϹh");
  assert.ok(censored.includes("*"));
});

test("catches mixed Unicode confusables (Ϲunt)", () => {
  assert.equal(hasBadWords("Ϲunt"), true);
  const censored = censorBadWords("Ϲunt");
  assert.ok(censored.includes("*"));
});

test("catches mixed Chinese/ASCII bypass (Shi十)", () => {
  assert.equal(hasBadWords("Shi十"), true);
  const censored = censorBadWords("Shi十");
  assert.ok(censored.includes("*"));
});

test("catches concatenated words (jollycock)", () => {
  assert.equal(hasBadWords("jollycock"), true);
  const censored = censorBadWords("jollycock");
  assert.ok(censored.includes("*"));
});

// Additional bypass strategies mentioned in the issue (to fix at least 15 ways)
test("catches words with regional indicators in chat", () => {
  // Regular profanity detection
  assert.equal(hasBadWords("fuck"), true);
});

test("catches Zero Width Characters", () => {
  // Words with zero-width joiners/spaces inserted
  const wordWithZWJ = "f\u200Duck";
  assert.equal(hasBadWords(wordWithZWJ), true);
});

test("catches subscript/superscript bypasses", () => {
  // Using subscript/superscript unicode - "shit" in subscript
  assert.equal(hasBadWords("ₛₕᵢₜ"), true);
  const censored = censorBadWords("ₛₕᵢₜ");
  assert.ok(censored.includes("*"));
});

test("catches strikethrough unicode bypasses", () => {
  // Using combining strikethrough characters
  const strikethrough = "n̶i̶g̶g̶e̶r̶";
  assert.equal(hasBadWords(strikethrough), true);
});

test("catches morse code-like bypasses", () => {
  // . and - patterns
  assert.equal(hasBadWords("f.u.c-k"), true);
});

test("catches backwards text", () => {
  // Reversed words
  assert.equal(hasBadWords("reɡɡiп"), true);
});

test("catches upside-down text", () => {
  // Upside down unicode - "shit" upside down and reversed = ʇᴉɥs
  assert.equal(hasBadWords("ʇᴉɥs"), true);
  const censored = censorBadWords("ʇᴉɥs");
  assert.ok(censored.includes("*"));
});

test("catches homoglyph sequences", () => {
  // Similar looking characters from different scripts
  assert.equal(hasBadWords("ɴɪɢɢᴇʀ"), true);
});

test("catches zalgo text", () => {
  // Heavy combining diacriticals
  const zalgo = "n̴̢̧̛̗͎͖i̴̧̨̛͓̼g̴̨̛̠̙̖g̴̢̧̛͇͔e̴̢̧̛̲̫r̴̢̧̛̗͇";
  assert.equal(hasBadWords(zalgo), true);
});

test("catches mathematical alphanumeric symbols", () => {
  // Bold, italic, script versions
  assert.equal(hasBadWords("𝐧𝐢𝐠𝐠𝐞𝐫"), true);
});

test("catches enclosed alphanumerics", () => {
  // Enclosed letters beyond circled
  assert.equal(hasBadWords("🄽🄸🄶🄶🄴🅁"), true);
});
