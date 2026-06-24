import path from 'node:path';
import { DATA_ROOT } from './paths.js';

const ALLOWED_HTTP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Ensure a write target stays under the sandbox data root (never the git repo).
 * @param {string} filePath
 * @param {string} [dataRoot]
 * @throws {Error} When path escapes DATA_ROOT
 */
export function assertWritePathUnderDataRoot(filePath, dataRoot = DATA_ROOT) {
  const resolved = path.resolve(filePath);
  const root = path.resolve(dataRoot);
  const relative = path.relative(root, resolved);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return resolved;
  }
  throw new Error(
    `Sandbox violation: writes must stay under DATA_ROOT (${root}). Blocked: ${resolved}`,
  );
}

/**
 * Block outbound HTTP outside localhost mock API (POC simulacrum rule).
 * @param {string} urlString
 * @throws {Error} When URL is not a permitted local mock endpoint
 */
export function assertAllowedHttpUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Sandbox violation: invalid URL ${urlString}`);
  }

  if (url.protocol !== 'http:') {
    throw new Error(
      `Sandbox violation: only http://localhost mock calls allowed, got ${url.protocol}//${url.hostname}`,
    );
  }

  if (!ALLOWED_HTTP_HOSTS.has(url.hostname)) {
    throw new Error(
      `Sandbox violation: HTTP host must be localhost, got ${url.hostname}`,
    );
  }
}

/**
 * Whether mock HTTP integrations are enabled (mock-api process running).
 * @returns {boolean}
 */
export function isMockApiEnabled() {
  return process.env.N8N_MOCK_API_ENABLED === '1';
}

/**
 * Default skipHttp for pipeline routes: skip unless mock API explicitly enabled.
 * @param {boolean|undefined} explicit
 * @returns {boolean}
 */
export function defaultSkipHttp(explicit) {
  if (explicit !== undefined) {
    return explicit;
  }
  return !isMockApiEnabled();
}
