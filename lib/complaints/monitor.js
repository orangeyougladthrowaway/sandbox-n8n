import { parseEmlBody } from './normalize.js';
import { classifyComplaint } from './classify.js';
import { appendLifecycleEvent } from '../schemas/complaint.js';

/**
 * Process inbound reply and link to existing complaint by thread_id.
 * @param {string} replyContent
 * @param {import('../schemas/complaint.js').ComplaintRecord} existing
 * @returns {import('../schemas/complaint.js').ComplaintRecord}
 */
export function processReply(replyContent, existing) {
  const body = parseEmlBody(replyContent);
  let updated = appendLifecycleEvent(existing, 'reply_received', {
    excerpt: body.slice(0, 120),
  });

  if (body.toLowerCase().includes('still unhappy') || body.toLowerCase().includes('escalate')) {
    updated = classifyComplaint(updated);
    updated = { ...updated, status: 'escalated' };
    updated = appendLifecycleEvent(updated, 'escalated', { reason: 'reply sentiment' });
  } else {
    updated = { ...updated, status: 'open' };
    updated = appendLifecycleEvent(updated, 'updated', { reason: 'reply processed' });
  }

  return updated;
}

/**
 * Extract Thread-ID header from eml content.
 * @param {string} raw
 * @returns {string|null}
 */
export function extractThreadId(raw) {
  const match = raw.match(/^Thread-ID:\s*(.+)$/im);
  return match ? match[1].trim() : null;
}
