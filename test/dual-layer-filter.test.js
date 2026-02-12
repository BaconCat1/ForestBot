import test from "node:test";
import assert from "node:assert/strict";
import { censorBadWords } from "../build/structure/mineflayer/utils/profanityFilter.js";
import { applySecondaryFilter, hasSecondaryProfanity } from "../build/structure/mineflayer/utils/secondaryProfanityFilter.js";

test("secondary filter catches words missed by first layer", () => {
  // "bloody" is not in the first layer's bad words list
  const firstPass = censorBadWords("bloody hell");
  assert.equal(firstPass, "bloody hell"); // First layer doesn't censor it
  
  const secondPass = applySecondaryFilter(firstPass);
  assert.ok(secondPass.includes("*")); // Second layer should catch "bloody"
  assert.notEqual(secondPass, "bloody hell");
});

test("dual-layer filtering applies both filters in sequence", () => {
  const input = "FUCKY0UB1TCH and bloody hell";
  
  // First layer catches FUCKY0UB1TCH
  const firstPass = censorBadWords(input);
  assert.ok(firstPass.includes("*"));
  assert.ok(!firstPass.includes("FUCKY0UB1TCH"));
  
  // Second layer catches "bloody"
  const secondPass = applySecondaryFilter(firstPass);
  assert.ok(secondPass.includes("*"));
  assert.ok(!secondPass.includes("bloody"));
});

test("secondary filter avoids false positives on common words", () => {
  const commonWords = ["assistance", "assessment", "classic", "hello"];
  
  commonWords.forEach(word => {
    assert.equal(hasSecondaryProfanity(word), false, `Should not flag "${word}" as profanity`);
    assert.equal(applySecondaryFilter(word), word, `Should not censor "${word}"`);
  });
});

test("secondary filter detects additional profanity", () => {
  const profaneWords = ["bastard", "bloody", "piss"];
  
  profaneWords.forEach(word => {
    assert.equal(hasSecondaryProfanity(word), true, `Should flag "${word}" as profanity`);
    const censored = applySecondaryFilter(word);
    assert.ok(censored.includes("*"), `Should censor "${word}"`);
    assert.notEqual(censored, word, `Should change "${word}"`);
  });
});
