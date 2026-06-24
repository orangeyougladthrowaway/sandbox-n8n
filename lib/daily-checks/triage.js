import fs from 'node:fs';
import path from 'node:path';
import { DB_QUERIES_DIR } from '../core/paths.js';
import { summarizeException } from '../simulators/aiClient.js';
import { createTicketPayload, validateTicketPayload } from '../schemas/ticket.js';
import { createTicket } from '../simulators/ticketing.js';
import { defaultSkipHttp } from '../core/sandbox.js';

/**
 * Load SQL query text from repo.
 * @param {string} name
 * @returns {string}
 */
export function loadQuery(name) {
  const file = path.join(DB_QUERIES_DIR, 'daily-checks', `${name}.sql`);
  return fs.readFileSync(file, 'utf8');
}

/**
 * Execute daily check query (fixture rows — no real DB).
 * @param {string} queryName
 * @returns {{ query_name: string, rows: object[] }}
 */
export function runCheckQuery(queryName) {
  const fixtures = {
    'stale-pipeline': [
      { id: 'exc_001', severity: 'high', message: 'Batch lag exceeds 4h threshold', source: 'etl_monitor' },
    ],
    'null-required-fields': [
      { id: 'exc_002', severity: 'medium', message: 'Null values in required customer_id field', source: 'data_quality' },
    ],
  };
  return {
    query_name: queryName,
    rows: fixtures[queryName] ?? [],
  };
}

/**
 * Triage one exception row.
 * @param {object} row
 * @returns {{ row: object, triage: object, summary: object }}
 */
export function triageException(row) {
  const summary = summarizeException(row.message);
  const triage = {
    owner_team: row.severity === 'high' ? 'platform-team' : 'data-team',
    action: row.severity === 'high' ? 'investigate_immediately' : 'review_next_run',
    priority: row.severity === 'high' ? 'high' : 'medium',
  };
  return { row, triage, summary };
}

/**
 * Create ticket for triaged exception.
 * @param {object} row
 * @param {object} triage
 * @param {{ skipHttp?: boolean }} [options]
 * @returns {Promise<object>}
 */
export async function createExceptionTicket(row, triage, options = {}) {
  const payload = createTicketPayload({
    title: `Daily check: ${row.id}`,
    description: row.message,
    priority: triage.priority,
    source_ref: row.id,
    source_program: 'daily-checks',
    status: 'open',
    owner_team: triage.owner_team,
    metadata: { source: row.source, severity: row.severity },
  });
  const validation = validateTicketPayload(payload);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }
  const skipHttp = defaultSkipHttp(options.skipHttp);
  if (skipHttp) {
    return { ticket_ref: `tkt_sim_${row.id}`, simulated: true };
  }
  return createTicket(validation.payload);
}
