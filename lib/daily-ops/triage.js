import fs from 'node:fs';
import path from 'node:path';
import { DB_QUERIES_DIR, OUTBOUND_TEAMS } from '../core/paths.js';
import { assertWritePathUnderDataRoot } from '../core/sandbox.js';

/**
 * Load SQL query text from repo.
 * @param {string} name
 * @returns {string}
 */
export function loadOpsQuery(name) {
  const file = path.join(DB_QUERIES_DIR, 'daily-ops', `${name}.sql`);
  return fs.readFileSync(file, 'utf8');
}

/**
 * Execute daily ops query (fixture rows).
 * @param {string} queryName
 * @returns {{ query_name: string, rows: object[] }}
 */
export function runOpsQuery(queryName) {
  const fixtures = {
    'open-incidents': [
      { id: 'ops_001', title: 'VPN gateway degraded', owner_team: 'network-team', priority: 'high' },
    ],
    'pending-changes': [
      { id: 'ops_002', title: 'Certificate renewal due', owner_team: 'security-team', priority: 'medium' },
    ],
  };
  return { query_name: queryName, rows: fixtures[queryName] ?? [] };
}

/**
 * Triage ops row and dedupe against open tasks.
 * @param {object} row
 * @param {object[]} openTasks
 * @returns {{ row: object, route: object, duplicate: boolean }}
 */
export function triageOpsTask(row, openTasks = []) {
  const duplicate = openTasks.some((t) => t.source_ref === row.id);
  const route = {
    owner_team: row.owner_team,
    channel: 'teams',
    priority: row.priority,
    action: duplicate ? 'skip_duplicate' : 'notify_owner',
  };
  return { row, route, duplicate };
}

/**
 * Write Teams notification sim JSON.
 * @param {object} row
 * @param {object} route
 * @param {string} [outDir]
 * @returns {string}
 */
export function writeTeamsNotification(row, route, outDir = OUTBOUND_TEAMS) {
  assertWritePathUnderDataRoot(outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${row.id}-teams.json`);
  assertWritePathUnderDataRoot(file);
  const payload = {
    channel: route.channel,
    team: route.owner_team,
    title: row.title,
    priority: route.priority,
    at: new Date().toISOString(),
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return file;
}
