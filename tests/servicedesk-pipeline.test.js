import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FileServiceDeskStore } from '../lib/servicedesk/store.js';
import {
  normalizeTicketPayload,
  appendLifecycleEvent,
} from '../lib/servicedesk/intake.js';
import { classifyTicket } from '../lib/servicedesk/classify.js';
import { triageTicket } from '../lib/servicedesk/triage.js';
import { processTicketCycle, writeBotChatFile } from '../lib/servicedesk/pipeline.js';
import { loadFixtureQueue, pickNextTicket } from '../lib/servicedesk/queue.js';
import { evaluateConversation, appendConversationTurn } from '../lib/servicedesk/conversation.js';

const smokeRoot = path.join('C:\\sandbox-dir\\sandbox-n8n', '_smoke', 'sd-unit');

describe('FileServiceDeskStore', () => {
  it('upserts and retrieves tickets', () => {
    fs.rmSync(smokeRoot, { recursive: true, force: true });
    const db = path.join(smokeRoot, 'sd.json');
    const store = new FileServiceDeskStore(db);
    const t = normalizeTicketPayload({ summary: 'test', description: 'd' });
    store.upsertTicket(t);
    assert.equal(store.getTicket(t.id)?.summary, 'test');
    fs.rmSync(smokeRoot, { recursive: true, force: true });
  });

  it('appends events', () => {
    fs.rmSync(smokeRoot, { recursive: true, force: true });
    const store = new FileServiceDeskStore(path.join(smokeRoot, 'sd.json'));
    const t = normalizeTicketPayload({ summary: 'x', description: 'y' });
    store.upsertTicket(t);
    store.appendEvent(t.id, 'classified', {});
    assert.equal(store.data.events.length, 1);
    fs.rmSync(smokeRoot, { recursive: true, force: true });
  });
});

describe('servicedesk pipeline unit', () => {
  it('writes bot chat file under data root', () => {
    fs.rmSync(smokeRoot, { recursive: true, force: true });
    const out = path.join(smokeRoot, 'chat');
    const t = normalizeTicketPayload({ summary: 'VPN', description: 'broken' });
    const file = writeBotChatFile(t, 'Hello user', out);
    assert.ok(fs.existsSync(file));
    fs.rmSync(smokeRoot, { recursive: true, force: true });
  });

  it('processes new ticket to awaiting_user', async () => {
    fs.rmSync(smokeRoot, { recursive: true, force: true });
    const store = new FileServiceDeskStore(path.join(smokeRoot, 'sd.json'));
    const out = path.join(smokeRoot, 'out');
    let t = loadFixtureQueue().find((x) => x.id === 'sd_vague_vpn');
    assert.ok(t);
    t = await processTicketCycle(t, store, {
      skipHttp: true,
      outDir: out,
      fixtureId: 'vague-vpn',
    });
    assert.equal(t.status, 'awaiting_user');
    fs.rmSync(smokeRoot, { recursive: true, force: true });
  });

  it('critical ticket in queue sorts first', () => {
    const q = loadFixtureQueue();
    const picked = pickNextTicket(q);
    assert.equal(picked.priority, 'critical');
  });
});

describe('conversation evaluation edge cases', () => {
  it('awaits user when no reply yet', () => {
    let t = normalizeTicketPayload({ summary: 'VPN', description: 'x', status: 'awaiting_user' });
    t = appendConversationTurn(t, { actor: 'bot', text: 'question?', intent: 'elicit' });
    assert.equal(evaluateConversation(t).action, 'await_user');
  });

  it('completes when user confirms yes with no gaps', () => {
    let t = normalizeTicketPayload({
      summary: 'password reset please',
      description: 'reset my password for portal',
      status: 'awaiting_user',
    });
    t = { ...t, kb_matches: [{ doc_id: 'password-reset', title: 'Password Reset', excerpt: '', score: 1 }] };
    t = appendConversationTurn(t, { actor: 'bot', text: 'confirm?', intent: 'confirm' });
    t = appendConversationTurn(t, { actor: 'user', text: 'yes', intent: 'reply' });
    assert.equal(evaluateConversation(t).action, 'complete');
  });

  it('classify adds lifecycle event', () => {
    let t = normalizeTicketPayload({ summary: 'VPN', description: 'down' });
    t = classifyTicket(t, { fixtureId: 'critical-outage' });
    assert.ok(t.lifecycle_events.some((e) => e.type === 'classified'));
  });

  it('triage adds lifecycle event', () => {
    let t = normalizeTicketPayload({ summary: 'VPN', description: 'down' });
    t = classifyTicket(t);
    t = triageTicket(t);
    assert.ok(t.lifecycle_events.some((e) => e.type === 'triaged'));
  });

  it('intake appendLifecycleEvent via re-export', () => {
    const t = normalizeTicketPayload({ summary: 'a', description: 'b' });
    const u = appendLifecycleEvent(t, 'updated', { ok: true });
    assert.ok(u.lifecycle_events.length >= 2);
  });
});
