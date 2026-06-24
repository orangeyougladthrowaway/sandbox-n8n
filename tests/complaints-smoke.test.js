import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runComplaintsSmoke } from '../lib/complaints/pipeline.js';

describe('complaints smoke', () => {
  it('runs full intake → classify → route → notify → reply scenarios', async () => {
    const result = await runComplaintsSmoke();
    assert.equal(result.passed, 4);
    assert.equal(result.scenarios.every((s) => s.ok), true);
  });
});
