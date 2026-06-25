import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isN8nCliAvailable, runN8nWorkflowSmokes } from '../lib/test/n8nSmokeHarness.js';

describe('n8n workflow CLI smokes', { skip: !isN8nCliAvailable() }, () => {
  it('imports and executes all repo workflows', async () => {
    const result = await runN8nWorkflowSmokes();
    assert.equal(result.skipped, false);
    assert.equal(result.passed, 22);
  });
});
