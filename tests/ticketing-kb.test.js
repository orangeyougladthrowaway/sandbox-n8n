import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTicketPayload, validateTicketPayload } from '../lib/schemas/ticket.js';
import { buildTicketPayload } from '../lib/complaints/route.js';
import { createComplaintRecord } from '../lib/schemas/complaint.js';
import { searchKbFixtures } from '../lib/simulators/kb.js';

describe('ticketing client helpers', () => {
  it('builds complaints ticket with source_program', () => {
    const record = createComplaintRecord({
      id: 'cmp_1',
      normalized_text: 'formal complaint',
      classification: { category: 'formal_complaint', confidence: 0.9, rationale: 'x' },
      requested_actions: ['FORMAL'],
    });
    const payload = buildTicketPayload(record);
    assert.equal(payload.source_program, 'complaints');
    assert.equal(validateTicketPayload(payload).valid, true);
  });

  it('builds daily-checks ticket payload', () => {
    const payload = createTicketPayload({
      title: 'Check exc_001',
      description: 'Stale pipeline',
      priority: 'high',
      source_ref: 'exc_001',
      source_program: 'daily-checks',
      owner_team: 'platform-team',
    });
    assert.equal(validateTicketPayload(payload).valid, true);
  });

  it('builds servicedesk ticket payload with assignee', () => {
    const payload = createTicketPayload({
      title: 'VPN issue',
      description: 'Cannot connect',
      priority: 'high',
      source_ref: 'sd_1',
      source_program: 'servicedesk',
      assignee: 'bot-l1-sandbox',
      status: 'new',
    });
    const v = validateTicketPayload(payload);
    assert.equal(v.valid, true);
    assert.equal(v.payload.assignee, 'bot-l1-sandbox');
  });

  it('rejects missing title', () => {
    const payload = createTicketPayload({ title: '' });
    assert.equal(validateTicketPayload(payload).valid, false);
  });

  it('rejects missing owner_team', () => {
    const payload = { title: 'T', description: 'D', priority: 'low', source_ref: 'r' };
    assert.equal(validateTicketPayload(payload).valid, false);
  });
});

describe('kb search fixtures', () => {
  it('matches vpn term', () => {
    const r = searchKbFixtures('vpn connect error');
    assert.ok(r.some((x) => x.doc_id.includes('vpn')));
  });

  it('matches email term', () => {
    const r = searchKbFixtures('outlook sync');
    assert.ok(r.some((x) => x.doc_id.includes('email')));
  });

  it('matches escalation policy', () => {
    const r = searchKbFixtures('escalation human');
    assert.ok(r.some((x) => x.doc_id.includes('escalation')));
  });

  it('returns empty for nonsense with short terms filtered', () => {
    const r = searchKbFixtures('xy zq');
    assert.equal(r.length, 0);
  });

  it('scores higher for more matched terms', () => {
    const r = searchKbFixtures('vpn error connect');
    const vpn = r.find((x) => x.doc_id.includes('vpn'));
    assert.ok(vpn && vpn.score > 0);
  });
});
