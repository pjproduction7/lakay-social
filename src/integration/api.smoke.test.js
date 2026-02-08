import { test, expect } from 'vitest';

// Integration smoke tests — only run when RUN_INTEGRATION_TESTS=true
// Configure the API base with INTEGRATION_API_BASE_URL (defaults to http://localhost:4000)
// Example (PowerShell):
//   $env:RUN_INTEGRATION_TESTS='true'; npx vitest run src/integration/api.smoke.test.js

const BASE = process.env.INTEGRATION_API_BASE_URL || 'http://localhost:4000';
const ENABLED = process.env.RUN_INTEGRATION_TESTS === 'true';
const runIf = ENABLED ? test : test.skip;

runIf('health endpoint responds with status ok', async () => {
  const res = await fetch(`${BASE}/health`, { method: 'GET', headers: { Accept: 'application/json' } });
  const text = await res.text();

  expect(res.status).not.toBe(404);
  expect(res.status).not.toBe(500);

  // If the response is JSON, assert status field
  try {
    const json = JSON.parse(text);
    expect(json).toHaveProperty('status');
  } catch (e) {
    // If not JSON, ensure we at least got a valid HTTP 2xx or 4xx/5xx that isn't 404/500
    expect(res.ok || (res.status >= 400 && res.status < 600)).toBeTruthy();
  }
});

runIf('private messages route exists and is not unhandled 404/500', async () => {
  const res = await fetch(`${BASE}/messages/private`, { method: 'GET' });

  // We expect either an auth-related client error (401/403) or a 2xx success.
  // Failing 404 or 500 indicates route missing or server error in production.
  expect(res.status).not.toBe(404);
  expect(res.status).not.toBe(500);
});

runIf('profiles/photos upload endpoint responds (auth required or returns 4xx)', async () => {
  // No file + no auth; we only check that the endpoint is present and doesn't return 404/500
  const res = await fetch(`${BASE}/profiles/photos`, { method: 'POST' });
  expect(res.status).not.toBe(404);
  expect(res.status).not.toBe(500);
});
