import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the repository root (code, workflows, docs). */
export const REPO_ROOT =
  process.env.N8N_REPO_ROOT?.trim() ||
  path.resolve(__dirname, '..', '..');

/**
 * Absolute path to the sandbox data root (runtime files outside git).
 * Override with N8N_DATA_ROOT (default: C:\sandbox-dir\sandbox-n8n).
 */
export const DATA_ROOT =
  process.env.N8N_DATA_ROOT?.trim() || 'C:\\sandbox-dir\\sandbox-n8n';

// --- Platform data tree ---

export const INBOUND_MAILBOX = path.join(DATA_ROOT, 'inbound', 'mailbox');
export const INBOUND_MAILBOX_REPLIES = path.join(INBOUND_MAILBOX, 'replies');
export const INBOUND_SCANS = path.join(DATA_ROOT, 'inbound', 'scans');
export const INBOUND_TRANSCRIPTS = path.join(DATA_ROOT, 'inbound', 'transcripts');
export const INBOUND_SERVICEDESK_CHAT = path.join(DATA_ROOT, 'inbound', 'servicedesk', 'chat');
export const OUTBOUND_SENT = path.join(DATA_ROOT, 'outbound', 'sent');
export const OUTBOUND_TEAMS = path.join(DATA_ROOT, 'outbound', 'teams');
export const OUTBOUND_SERVICEDESK_CHAT = path.join(DATA_ROOT, 'outbound', 'servicedesk', 'chat');
export const CURSOR_REQUESTS = path.join(DATA_ROOT, 'cursor-requests');
export const SMOKE_ROOT = path.join(DATA_ROOT, '_smoke');

/** Repo-relative paths */
export const FIXTURES_DIR = path.join(REPO_ROOT, 'fixtures');
export const PROMPTS_DIR = path.join(REPO_ROOT, 'prompts');
export const DB_SCHEMA_DIR = path.join(REPO_ROOT, 'db', 'schema');
export const DB_SEEDS_DIR = path.join(REPO_ROOT, 'db', 'seeds');
export const DB_QUERIES_DIR = path.join(REPO_ROOT, 'db', 'queries');
export const WORKFLOWS_DIR = path.join(REPO_ROOT, 'workflows');

/** Default bot technician persona for service desk polling. */
export const DEFAULT_BOT_TECH_ID =
  process.env.N8N_SERVICEDESK_BOT_TECH_ID?.trim() || 'bot-l1-sandbox';

/**
 * file:// URL for importing lib from n8n Code nodes.
 * @returns {string}
 */
export function libImportUrl() {
  return new URL('../index.js', import.meta.url).href;
}

/**
 * Resolve lib module path for n8n Code nodes.
 * @param {string} modulePath - Path relative to lib/ (e.g. 'complaints/intake.js').
 * @returns {string}
 */
export function libModulePath(modulePath) {
  return path.join(REPO_ROOT, 'lib', modulePath);
}
