import test from "node:test";
import assert from "node:assert/strict";
import fetch from "node-fetch";

const LOOKUP_USERNAME = "Digital_10";

async function fetchJson(url, { timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

test("Ashcon API returns name history for a username lookup", async () => {
  const profileUrl = `https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(LOOKUP_USERNAME)}`;
  const profileResponse = await fetchJson(profileUrl);
  assert.ok(profileResponse.ok, `Profile lookup failed: ${profileResponse.status}`);

  const profile = await profileResponse.json();
  assert.ok(profile?.uuid, "Profile response missing uuid");
  assert.ok(Array.isArray(profile?.username_history), "Profile response missing username_history");
  assert.ok(profile.username_history.length > 0, "Name history is empty");

  const names = profile.username_history.map((entry) => entry.username).filter(Boolean);
  assert.ok(names.length > 0, "No names found in history");
  if (profile?.username) {
    assert.ok(
      names.some((name) => name.toLowerCase() === profile.username.toLowerCase()),
      `Expected to find current username ${profile.username} in history, got: ${names.join(", ")}`
    );
  }
});
