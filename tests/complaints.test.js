import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createComplaintRecord,
  validateComplaintRecord,
  appendLifecycleEvent,
} from '../lib/schemas/complaint.js';
import { analyzeText } from '../lib/simulators/aiClient.js';
import { classifyComplaint } from '../lib/complaints/classify.js';
import {
  normalizeInboundArtifact,
  parseEmlBody,
  fixtureIdFromPath,
} from '../lib/complaints/normalize.js';
import { buildTicketPayload } from '../lib/complaints/route.js';
import { validateTicketPayload } from '../lib/schemas/ticket.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '..', 'fixtures', 'complaints');

describe('complaint schema', () => {
  it('validates a complete record', () => {
    const record = createComplaintRecord({
      id: 'cmp_test',
      normalized_text: 'hello',
      requested_actions: ['SUPPORT_ONLY'],
      classification: { category: 'support', confidence: 0.5, rationale: 'test' },
    });
    const result = validateComplaintRecord(record);
    assert.equal(result.valid, true);
  });

  it('rejects invalid channel', () => {
    const record = createComplaintRecord({ id: 'x', channel: 'fax' });
    const result = validateComplaintRecord(record);
    assert.equal(result.valid, false);
  });

  it('appends lifecycle events', () => {
    const base = createComplaintRecord({ id: 'cmp_evt' });
    const updated = appendLifecycleEvent(base, 'received', { ok: true });
    assert.equal(updated.lifecycle_events.length, 1);
    assert.equal(updated.lifecycle_events[0].type, 'received');
  });
});

describe('aiClient simulator', () => {
  it('classifies DSAR keywords', () => {
    const result = analyzeText('I want a subject access request for my data');
    assert.equal(result.classification.category, 'dsar');
    assert.ok(result.requested_actions.includes('DSAR'));
  });

  it('uses fixture angry-support', () => {
    const result = analyzeText('', { fixtureId: 'angry-support' });
    assert.equal(result.classification.category, 'support');
    assert.deepEqual(result.requested_actions, ['SUPPORT_ONLY']);
  });
});

describe('complaints normalize + classify', () => {
  it('parses eml body', () => {
    const raw = 'Subject: Hi\n\nHello world';
    assert.equal(parseEmlBody(raw), 'Hello world');
  });

  it('normalizes angry-support fixture', () => {
    const filePath = path.join(fixturesDir, 'angry-support.eml');
    const content = fs.readFileSync(filePath, 'utf8');
    const record = normalizeInboundArtifact(filePath, content);
    assert.equal(record.channel, 'mailbox');
    assert.ok(record.normalized_text.includes('hold'));
    assert.equal(fixtureIdFromPath(filePath), 'angry-support');
  });

  it('classifies formal-dsar fixture', () => {
    const filePath = path.join(fixturesDir, 'formal-dsar.eml');
    const content = fs.readFileSync(filePath, 'utf8');
    let record = normalizeInboundArtifact(filePath, content);
    record = classifyComplaint(record);
    assert.equal(record.classification.category, 'dsar');
    assert.ok(record.requested_actions.includes('DSAR'));
  });
});

describe('ticket payload', () => {
  it('builds valid ticket from classified complaint', () => {
    let record = createComplaintRecord({
      id: 'cmp_tkt',
      normalized_text: 'FCA compliance issue',
      classification: { category: 'compliance', confidence: 0.9, rationale: 'test' },
      requested_actions: ['COMPLIANCE'],
    });
    record = classifyComplaint(record);
    const payload = buildTicketPayload(record);
    const validation = validateTicketPayload(payload);
    assert.equal(validation.valid, true);
    assert.equal(payload.priority, 'critical');
  });
});
