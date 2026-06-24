import fs from 'node:fs';
import path from 'node:path';
import { SMOKE_ROOT } from '../core/paths.js';
import { runCheckQuery, triageException, createExceptionTicket } from './triage.js';
import { writeCursorBundle, newCheckRunId } from './cursorBundle.js';

/**
 * @returns {string}
 */
export function dailyChecksSmokeRoot() {
  return path.join(SMOKE_ROOT, 'daily-checks');
}

/**
 * Run daily checks smoke scenarios.
 * @returns {Promise<{ passed: number, scenarios: object[] }>}
 */
export async function runDailyChecksSmoke() {
  const root = dailyChecksSmokeRoot();
  fs.rmSync(root, { recursive: true, force: true });
  const cursorRoot = path.join(root, 'cursor-requests');
  fs.mkdirSync(cursorRoot, { recursive: true });

  const checkRunId = newCheckRunId();
  const scenarios = [];
  const queries = ['stale-pipeline', 'null-required-fields'];

  for (const q of queries) {
    const result = runCheckQuery(q);
    for (const row of result.rows) {
      const { triage, summary } = triageException(row);
      const ticket = await createExceptionTicket(row, triage, { skipHttp: true });
      const bundleDir = writeCursorBundle({
        checkRunId,
        row,
        triage,
        summary,
        outRoot: cursorRoot,
      });
      scenarios.push({
        name: `${q}-${row.id}`,
        ticket_ref: ticket.ticket_ref,
        bundle: bundleDir,
        ok: fs.existsSync(path.join(bundleDir, 'pr-summary.md')),
      });
    }
  }

  fs.rmSync(root, { recursive: true, force: true });
  return { passed: scenarios.filter((s) => s.ok).length, scenarios };
}
