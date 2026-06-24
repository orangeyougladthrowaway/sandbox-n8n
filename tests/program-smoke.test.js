import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runComplaintsSmoke } from '../lib/complaints/pipeline.js';
import { runServiceDeskSmoke } from '../lib/servicedesk/pipeline.js';
import { runDailyChecksSmoke } from '../lib/daily-checks/pipeline.js';
import { runDailyOpsSmoke } from '../lib/daily-ops/pipeline.js';

describe('program smoke harnesses', () => {
  it('complaints smoke passes', async () => {
    const result = await runComplaintsSmoke();
    assert.equal(result.passed, result.scenarios.length);
  });

  it('servicedesk smoke passes', async () => {
    const result = await runServiceDeskSmoke();
    assert.ok(result.passed >= 4);
  });

  it('daily checks smoke passes', async () => {
    const result = await runDailyChecksSmoke();
    assert.ok(result.passed >= 2);
  });

  it('daily ops smoke passes', async () => {
    const result = await runDailyOpsSmoke();
    assert.ok(result.passed >= 2);
  });
});
