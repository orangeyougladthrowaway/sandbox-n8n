import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createServiceDeskTicket,
  validateServiceDeskTicket,
  appendLifecycleEvent,
} from '../lib/schemas/servicedesk-ticket.js';
import { normalizeTicketPayload } from '../lib/servicedesk/intake.js';
import { classifyTicket } from '../lib/servicedesk/classify.js';
import { triageTicket, prioritySortKey } from '../lib/servicedesk/triage.js';
import { analyzeKb } from '../lib/servicedesk/kb.js';
import { detectGaps, userRequestedHandoff, generateElicitationMessage } from '../lib/servicedesk/elicitation.js';
import { evaluateConversation, appendConversationTurn } from '../lib/servicedesk/conversation.js';
import { handoffToTechnician, buildHandoffSummary } from '../lib/servicedesk/handoff.js';
import { loadFixtureQueue, pickNextTicket } from '../lib/servicedesk/queue.js';
import { searchKbFixtures } from '../lib/simulators/kb.js';

describe('servicedesk schema', () => {
  it('creates and validates ticket', () => {
    const ticket = createServiceDeskTicket({ summary: 'VPN issue' });
    const result = validateServiceDeskTicket(ticket);
    assert.equal(result.valid, true);
  });

  it('appends lifecycle events', () => {
    const ticket = createServiceDeskTicket({ summary: 'test' });
    const updated = appendLifecycleEvent(ticket, 'classified', { ok: true });
    assert.equal(updated.lifecycle_events.length, 2);
  });
});

describe('servicedesk classify and triage', () => {
  it('classifies vague VPN fixture', () => {
    let ticket = normalizeTicketPayload({ summary: 'VPN broken', description: 'cannot connect' });
    ticket = classifyTicket(ticket, { fixtureId: 'vague-vpn' });
    assert.equal(ticket.classification.category, 'incident');
    assert.equal(ticket.priority, 'high');
  });

  it('triages into queue', () => {
    let ticket = createServiceDeskTicket({ summary: 'reset password please' });
    ticket = classifyTicket(ticket, { fixtureId: 'clear-password-reset' });
    ticket = triageTicket(ticket);
    assert.ok(ticket.triage.queue);
    assert.equal(ticket.status, 'in_bot_triage');
  });
});

describe('servicedesk kb', () => {
  it('finds VPN article in fixtures', async () => {
    const ticket = createServiceDeskTicket({ summary: 'VPN error', description: 'vpn connect' });
    const updated = await analyzeKb(ticket, { skipHttp: true });
    assert.ok(updated.kb_matches.length > 0);
  });

  it('searchKbFixtures returns scored results', () => {
    const results = searchKbFixtures('password');
    assert.ok(results.some((r) => r.doc_id.includes('password')));
  });
});

describe('servicedesk conversation', () => {
  it('detects gaps for vague VPN', () => {
    const ticket = createServiceDeskTicket({ summary: 'VPN', description: 'not working' });
    const gaps = detectGaps(ticket);
    assert.ok(gaps.length > 0);
  });

  it('detects handoff request', () => {
    assert.equal(userRequestedHandoff('I want to speak to a person'), true);
  });

  it('generates elicitation message', () => {
    const ticket = createServiceDeskTicket({ summary: 'VPN', description: 'broken' });
    const msg = generateElicitationMessage(ticket);
    assert.ok(msg.text.length > 0);
  });

  it('evaluates handoff on user request', () => {
    let ticket = createServiceDeskTicket({ summary: 'VPN', description: 'broken', status: 'awaiting_user' });
    ticket = appendConversationTurn(ticket, { actor: 'user', text: 'speak to a person please' });
    const decision = evaluateConversation(ticket);
    assert.equal(decision.action, 'handoff');
  });

  it('builds handoff summary', () => {
    const ticket = createServiceDeskTicket({ summary: 'VPN', description: 'broken' });
    const summary = buildHandoffSummary(ticket, 'test');
    assert.match(summary, /Handoff/);
  });

  it('handoffs to technician', () => {
    let ticket = createServiceDeskTicket({ summary: 'VPN', description: 'broken' });
    ticket = classifyTicket(ticket, { fixtureId: 'vague-vpn' });
    ticket = triageTicket(ticket);
    ticket = handoffToTechnician(ticket, 'user_requested_human');
    assert.equal(ticket.status, 'with_technician');
    assert.ok(ticket.assignment.handoff_at);
  });
});

describe('servicedesk queue', () => {
  it('loads fixture queue', () => {
    const queue = loadFixtureQueue();
    assert.ok(queue.length >= 4);
  });

  it('picks critical before medium', () => {
    const queue = loadFixtureQueue();
    const critical = queue.find((t) => t.priority === 'critical');
    const medium = queue.find((t) => t.priority === 'medium' && t.status === 'new');
    const picked = pickNextTicket([medium, critical]);
    assert.equal(picked.priority, 'critical');
  });

  it('prioritySortKey orders correctly', () => {
    assert.ok(prioritySortKey({ priority: 'critical' }) < prioritySortKey({ priority: 'low' }));
  });
});
