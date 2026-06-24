import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadQuery, runCheckQuery } from '../lib/daily-checks/triage.js';
import { loadOpsQuery, runOpsQuery } from '../lib/daily-ops/triage.js';
import { DEFAULT_BOT_TECH_ID } from '../lib/paths.js';

describe('query fixtures', () => {
  it('daily-checks stale query references batch_lag', () => {
    assert.match(loadQuery('stale-pipeline'), /batch_lag/);
  });

  it('daily-checks null query references customer_id', () => {
    assert.match(loadQuery('null-required-fields'), /customer_id/);
  });

  it('daily-ops open incidents query', () => {
    assert.match(loadOpsQuery('open-incidents'), /open_incidents/);
  });

  it('runCheckQuery unknown returns empty rows', () => {
    assert.deepEqual(runCheckQuery('missing').rows, []);
  });

  it('runOpsQuery pending-changes has one row', () => {
    assert.equal(runOpsQuery('pending-changes').rows.length, 1);
  });

  it('bot tech id is stable default', () => {
    assert.equal(DEFAULT_BOT_TECH_ID, 'bot-l1-sandbox');
  });
});
