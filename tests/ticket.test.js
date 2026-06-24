import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTicketPayload,
  createTicketPayload,
  SOURCE_PROGRAMS,
  TICKET_PRIORITIES,
} from '../lib/schemas/ticket.js';

describe('unified ticket schema', () => {
  it('validates complete payload', () => {
    const payload = createTicketPayload({
      title: 'Test',
      description: 'Desc',
      priority: 'high',
      source_ref: 'ref_1',
      source_program: 'servicedesk',
    });
    const result = validateTicketPayload(payload);
    assert.equal(result.valid, true);
  });

  it('rejects invalid priority', () => {
    const payload = createTicketPayload({ priority: 'urgent' });
    const result = validateTicketPayload(payload);
    assert.equal(result.valid, false);
  });

  it('rejects invalid source_program', () => {
    const payload = createTicketPayload({ source_program: 'unknown' });
    const result = validateTicketPayload(payload);
    assert.equal(result.valid, false);
  });

  it('exports program and priority enums', () => {
    assert.ok(SOURCE_PROGRAMS.includes('complaints'));
    assert.ok(TICKET_PRIORITIES.includes('critical'));
  });
});
