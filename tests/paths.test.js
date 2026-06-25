import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  REPO_ROOT,
  DATA_ROOT,
  INBOUND_SERVICEDESK_CHAT,
  OUTBOUND_SERVICEDESK_CHAT,
  libImportUrl,
  DEFAULT_BOT_TECH_ID,
} from '../lib/paths.js';

describe('paths', () => {
  it('keeps code under the repo root', () => {
    assert.ok(REPO_ROOT.length > 0);
    assert.ok(!INBOUND_SERVICEDESK_CHAT.startsWith(REPO_ROOT));
  });

  it('points platform dirs at the external data root', () => {
    assert.equal(INBOUND_SERVICEDESK_CHAT, path.join(DATA_ROOT, 'inbound', 'servicedesk', 'chat'));
    assert.equal(OUTBOUND_SERVICEDESK_CHAT, path.join(DATA_ROOT, 'outbound', 'servicedesk', 'chat'));
    assert.match(DATA_ROOT, /sandbox-dir[\\/]sandbox-n8n$/i);
  });

  it('exposes libImportUrl helper (legacy file URL)', () => {
    assert.match(libImportUrl(), /^file:\/\//);
    assert.match(libImportUrl(), /lib[\\/]index\.js$/);
  });

  it('defaults bot technician persona', () => {
    assert.equal(DEFAULT_BOT_TECH_ID, 'bot-l1-sandbox');
  });
});
