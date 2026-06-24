import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  assertWritePathUnderDataRoot,
  assertAllowedHttpUrl,
  defaultSkipHttp,
} from '../lib/core/sandbox.js';
import { mockApiBaseUrl } from '../lib/core/http.js';

describe('sandbox boundaries', () => {
  const dataRoot = 'C:\\sandbox-dir\\sandbox-n8n';

  it('allows writes under DATA_ROOT', () => {
    const p = path.join(dataRoot, 'inbound', 'mailbox', 'test.eml');
    assert.equal(assertWritePathUnderDataRoot(p, dataRoot), p);
  });

  it('blocks writes outside DATA_ROOT', () => {
    assert.throws(
      () => assertWritePathUnderDataRoot('C:\\repos\\sandbox-n8n\\oops.txt', dataRoot),
      /Sandbox violation/,
    );
  });

  it('allows localhost mock API URL', () => {
    assert.doesNotThrow(() => assertAllowedHttpUrl('http://localhost:3099/tickets'));
  });

  it('blocks external HTTP URLs', () => {
    assert.throws(
      () => assertAllowedHttpUrl('https://api.example.com/v1'),
      /Sandbox violation/,
    );
    assert.throws(
      () => assertAllowedHttpUrl('http://evil.example.com/'),
      /Sandbox violation/,
    );
  });

  it('mockApiBaseUrl resolves to localhost', () => {
    assert.match(mockApiBaseUrl(), /^http:\/\/localhost/);
  });

  it('defaultSkipHttp is true unless N8N_MOCK_API_ENABLED=1', () => {
    const prev = process.env.N8N_MOCK_API_ENABLED;
    delete process.env.N8N_MOCK_API_ENABLED;
    assert.equal(defaultSkipHttp(undefined), true);
    process.env.N8N_MOCK_API_ENABLED = '1';
    assert.equal(defaultSkipHttp(undefined), false);
    if (prev === undefined) delete process.env.N8N_MOCK_API_ENABLED;
    else process.env.N8N_MOCK_API_ENABLED = prev;
  });
});
