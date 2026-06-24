import { searchKb } from '../simulators/kb.js';
import { appendLifecycleEvent } from '../schemas/servicedesk-ticket.js';

/**
 * Analyze ticket against KB and attach matches.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {{ skipHttp?: boolean }} [options]
 * @returns {Promise<import('../schemas/servicedesk-ticket.js').ServiceDeskTicket>}
 */
export async function analyzeKb(ticket, options = {}) {
  const query = `${ticket.summary} ${ticket.description}`.slice(0, 120);
  const matches = await searchKb(query, options);
  const updated = { ...ticket, kb_matches: matches };
  return appendLifecycleEvent(updated, 'kb_analyzed', { match_count: matches.length });
}
