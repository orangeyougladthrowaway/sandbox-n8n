import {
  assertAllowedHttpUrl,
  assertWritePathUnderDataRoot,
  isMockApiEnabled,
  defaultSkipHttp,
} from './sandbox.js';

export {
  assertWritePathUnderDataRoot,
  assertAllowedHttpUrl,
  isMockApiEnabled,
  defaultSkipHttp,
} from './sandbox.js';

/**
 * Default mock API base URL (local sandbox-services process).
 * @returns {string}
 */
export function mockApiBaseUrl() {
  const base = (
    process.env.MOCK_API_BASE_URL?.trim() ||
    process.env.N8N_MOCK_API_URL?.trim() ||
    'http://localhost:3099'
  );
  assertAllowedHttpUrl(base);
  return base.replace(/\/$/, '');
}

/**
 * POST JSON to mock API endpoint (localhost only).
 * @param {string} path - e.g. '/tickets'
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function postJson(path, body) {
  const url = `${mockApiBaseUrl()}${path}`;
  assertAllowedHttpUrl(url);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
  }
  return response.json();
}

/**
 * GET JSON from mock API (localhost only).
 * @param {string} path
 * @returns {Promise<object>}
 */
export async function getJson(path) {
  const url = `${mockApiBaseUrl()}${path}`;
  assertAllowedHttpUrl(url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

/**
 * PATCH JSON to mock API (localhost only).
 * @param {string} path
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function patchJson(path, body) {
  const url = `${mockApiBaseUrl()}${path}`;
  assertAllowedHttpUrl(url);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
  }
  return response.json();
}
