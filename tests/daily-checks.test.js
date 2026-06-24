import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadQuery,
  runCheckQuery,
  triageException,
  createExceptionTicket,
} from '../lib/daily-checks/triage.js';
import { writeCursorBundle, newCheckRunId } from '../lib/daily-checks/cursorBundle.js';
import { runDailyChecksSmoke } from '../lib/daily-checks/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const smokeRoot = path.join('C:\\sandbox-dir\\sandbox-n8n', '_smoke', 'daily-checks-test');

describe('daily checks', () => {
  it('loads SQL query files', () => {
    const sql = loadQuery('stale-pipeline');
    assert.match(sql, /batch_lag/i);
  });

  it('returns fixture rows for stale-pipeline', () => {
    const result = runCheckQuery('stale-pipeline');
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].id, 'exc_001');
  });

  it('triages exception with AI summary', () => {
    const row = { id: 'x', message: 'Pipeline lag exceeds threshold stale', severity: 'high' };
    const { triage, summary } = triageException(row);
    assert.equal(triage.owner_team, 'platform-team');
    assert.match(summary.summary, /lag/i);
  });

  it('creates simulated ticket offline', async () => {
    const row = { id: 'exc_test', message: 'null values missing', severity: 'medium' };
    const { triage } = triageException(row);
    const ticket = await createExceptionTicket(row, triage, { skipHttp: true });
    assert.match(ticket.ticket_ref, /tkt_sim/);
  });

  it('writes cursor bundle under data root', () => {
    fs.rmSync(smokeRoot, { recursive: true, force: true });
    const row = { id: 'exc_001', message: 'stale lag', severity: 'high' };
    const { triage, summary } = triageException(row);
    const dir = writeCursorBundle({
      checkRunId: newCheckRunId(),
      row,
      triage,
      summary,
      outRoot: path.join(smokeRoot, 'cursor-requests'),
    });
    assert.ok(fs.existsSync(path.join(dir, 'pr-summary.md')));
    fs.rmSync(smokeRoot, { recursive: true, force: true });
  });

  it('runs smoke scenarios', async () => {
    const result = await runDailyChecksSmoke();
    assert.ok(result.passed >= 2);
  });
});
