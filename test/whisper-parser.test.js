import test from "node:test";
import assert from "node:assert/strict";
import { parseWhisperMessage } from "../build/structure/mineflayer/utils/whisperParser.js";

test("parses PM arrow whisper format", () => {
  const parsed = parseWhisperMessage("[PM] Alice → ForestBot » !help", "ForestBot");
  assert.deepEqual(parsed, {
    sender: "Alice",
    recipient: "ForestBot",
    message: "!help",
  });
});

test("parses 'whispers to you' format", () => {
  const parsed = parseWhisperMessage("Alice whispers to you: !ping", "ForestBot");
  assert.deepEqual(parsed, {
    sender: "Alice",
    recipient: "ForestBot",
    message: "!ping",
  });
});

test("parses bracketed whisper format", () => {
  const parsed = parseWhisperMessage("[Alice -> me] !coords", "ForestBot");
  assert.deepEqual(parsed, {
    sender: "Alice",
    recipient: "ForestBot",
    message: "!coords",
  });
});

test("parses outgoing whisper format", () => {
  const parsed = parseWhisperMessage("To: Alice » hello there", "ForestBot");
  assert.deepEqual(parsed, {
    sender: "ForestBot",
    recipient: "Alice",
    message: "hello there",
  });
});

test("returns null for normal chat", () => {
  assert.equal(parseWhisperMessage("<Alice> hello", "ForestBot"), null);
});
