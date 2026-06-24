import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText, summarizeException } from '../lib/simulators/aiClient.js';

describe('aiClient', () => {
  it('detects compliance keywords', () => {
    const r = analyzeText('This is an FCA compliance breach notification');
    assert.equal(r.classification.category, 'compliance');
  });

  it('defaults to support', () => {
    const r = analyzeText('general question about my account');
    assert.equal(r.classification.category, 'support');
  });

  it('summarizes null exceptions', () => {
    const r = summarizeException('Row has null customer_id');
    assert.ok(r.summary.includes('integrity'));
  });
});
