import { randomUUID } from 'node:crypto';

/**
 * Structured log line for pipeline operations.
 * @param {string} level
 * @param {string} message
 * @param {Record<string, unknown>} [context]
 * @returns {object}
 */
export function logEvent(level, message, context = {}) {
  const entry = {
    at: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  if (process.env.N8N_LOG_JSON === '1') {
    console.log(JSON.stringify(entry));
  }
  return entry;
}

/**
 * Generate a unique ID for domain records.
 * @param {string} [prefix]
 * @returns {string}
 */
export function newId(prefix = 'rec') {
  return `${prefix}_${randomUUID()}`;
}
