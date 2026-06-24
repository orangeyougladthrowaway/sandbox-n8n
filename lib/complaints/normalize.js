import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  createComplaintRecord,
  validateComplaintRecord,
  appendLifecycleEvent,
} from '../schemas/complaint.js';
import { newId } from '../core/logging.js';

/**
 * Extract plain text from a minimal .eml body.
 * @param {string} raw
 * @returns {string}
 */
export function parseEmlBody(raw) {
  const parts = raw.split(/\r?\n\r?\n/);
  return parts.length > 1 ? parts.slice(1).join('\n').trim() : raw.trim();
}

/**
 * Parse JSON transcript fixture.
 * @param {string} raw
 * @returns {{ text: string, external_ref?: string }}
 */
export function parseTranscriptJson(raw) {
  const data = JSON.parse(raw);
  if (!data.transcript || typeof data.transcript !== 'string') {
    throw new Error('Transcript JSON must include transcript string');
  }
  return { text: data.transcript, external_ref: data.call_id };
}

/**
 * Detect channel from file path and content.
 * @param {string} filePath
 * @param {string} content
 * @returns {'mailbox'|'scan'|'transcript'}
 */
export function detectChannel(filePath, content) {
  const lower = filePath.toLowerCase();
  if (lower.includes('transcript') || lower.endsWith('.json')) {
    try {
      JSON.parse(content);
      return 'transcript';
    } catch {
      // fall through
    }
  }
  if (lower.includes('scan') || lower.endsWith('.pdf.txt')) {
    return 'scan';
  }
  return 'mailbox';
}

/**
 * Normalize raw inbound artifact to complaint draft.
 * @param {string} filePath
 * @param {string} content
 * @returns {import('../schemas/complaint.js').ComplaintRecord}
 */
export function normalizeInboundArtifact(filePath, content) {
  const channel = detectChannel(filePath, content);
  let normalizedText = content;
  let externalRef = null;

  if (channel === 'mailbox' || filePath.endsWith('.eml')) {
    normalizedText = parseEmlBody(content);
    const subjectMatch = content.match(/^Subject:\s*(.+)$/m);
    if (subjectMatch) {
      externalRef = subjectMatch[1].trim();
    }
  } else if (channel === 'transcript') {
    const parsed = parseTranscriptJson(content);
    normalizedText = parsed.text;
    externalRef = parsed.external_ref ?? null;
  }

  const record = createComplaintRecord({
    id: newId('cmp'),
    external_ref: externalRef,
    channel,
    received_at: new Date().toISOString(),
    raw_artifact_path: filePath,
    normalized_text: normalizedText,
    thread_id: `thread_${randomUUID()}`,
    status: 'open',
  });

  return appendLifecycleEvent(
    appendLifecycleEvent(record, 'received', { filePath }),
    'normalized',
    { channel, length: normalizedText.length },
  );
}

/**
 * Infer fixture ID from filename for deterministic classification in tests.
 * @param {string} filePath
 * @returns {string|undefined}
 */
export function fixtureIdFromPath(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  if (base.includes('angry-support')) return 'angry-support';
  if (base.includes('formal-dsar')) return 'formal-dsar';
  if (base.includes('compliance-action')) return 'compliance-action';
  return undefined;
}

/**
 * Validate normalized record before side effects.
 * @param {import('../schemas/complaint.js').ComplaintRecord} record
 * @returns {import('../schemas/complaint.js').ComplaintRecord}
 */
export function assertValidComplaint(record) {
  const result = validateComplaintRecord(record);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
  return result.record;
}
