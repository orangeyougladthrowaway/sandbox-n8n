import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadOpsQuery,
  runOpsQuery,
  triageOpsTask,
  writeTeamsNotification,
} from '../lib/daily-ops/triage.js';
import { runDailyOpsSmoke } from '../lib/daily-ops/pipeline.js';

const smokeRoot = path.join('C:\\sandbox-dir\\sandbox-n8n', '_smoke', 'daily-ops-test');

describe('daily ops', () => {
  it('loads SQL query files', () => {
    const sql = loadOpsQuery('open-incidents');
    assert.match(sql, /open_incidents/i);
  });

  it('returns fixture ops rows', () => {
    const result = runOpsQuery('pending-changes');
    assert.equal(result.rows.length, 1);
  });

  it('detects duplicate tasks', () => {
    const row = { id: 'ops_001', title: 'Test', owner_team: 'network-team', priority: 'high' };
    const first = triageOpsTask(row, []);
    const second = triageOpsTask(row, [{ source_ref: 'ops_001' }]);
    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, true);
  });

  it('writes teams notification file', () => {
    fs.rmSync(smokeRoot, { recursive: true, force: true });
    const outDir = path.join(smokeRoot, 'teams');
    const row = { id: 'ops_test', title: 'Test incident', owner_team: 'network-team', priority: 'high' };
    const { route } = triageOpsTask(row, []);
    const file = writeTeamsNotification(row, route, outDir);
    assert.ok(fs.existsSync(file));
    fs.rmSync(smokeRoot, { recursive: true, force: true });
  });

  it('runs smoke scenarios', async () => {
    const result = await runDailyOpsSmoke();
    assert.ok(result.passed >= 2);
  });
});
