import { validateTicketPayload } from '../schemas/ticket.js';
import { appendLifecycleEvent } from '../schemas/complaint.js';
import { syncComplaintToCrm } from '../simulators/crm.js';
import { createTicket } from '../simulators/ticketing.js';
import { defaultSkipHttp } from '../core/sandbox.js';

const OWNER_MAP = {
  dsar: 'privacy-team',
  formal_complaint: 'complaints-team',
  compliance: 'compliance-team',
  legal: 'legal-team',
  support: 'support-team',
};

const PRIORITY_MAP = {
  dsar: 'high',
  formal_complaint: 'high',
  compliance: 'critical',
  legal: 'critical',
  support: 'medium',
};

/**
 * Build ticket payload from classified complaint.
 * @param {import('../schemas/complaint.js').ComplaintRecord} record
 * @returns {import('../schemas/ticket.js').TicketPayload}
 */
export function buildTicketPayload(record) {
  const category = record.classification.category;
  return {
    title: `Complaint: ${category} — ${record.id}`,
    description: record.normalized_text.slice(0, 500),
    priority: PRIORITY_MAP[category] ?? 'medium',
    source_ref: record.id,
    source_program: 'complaints',
    status: 'open',
    owner_team: OWNER_MAP[category] ?? 'support-team',
    metadata: {
      requested_actions: record.requested_actions,
      sentiment: record.sentiment.label,
    },
  };
}

/**
 * Route complaint to mock CRM and ticketing (HTTP or skip if offline).
 * @param {import('../schemas/complaint.js').ComplaintRecord} record
 * @param {{ skipHttp?: boolean }} [options]
 * @returns {Promise<import('../schemas/complaint.js').ComplaintRecord>}
 */
export async function routeComplaint(record, options = {}) {
  const skipHttp = defaultSkipHttp(options.skipHttp);
  let updated = { ...record };

  if (!skipHttp) {
    try {
      const crm = await syncComplaintToCrm({
        complaint_id: record.id,
        category: record.classification.category,
        text: record.normalized_text.slice(0, 200),
      });
      updated = { ...updated, crm_ref: crm.crm_ref };
      updated = appendLifecycleEvent(updated, 'crm_synced', { crm_ref: crm.crm_ref });
    } catch {
      updated = { ...updated, crm_ref: `crm_sim_${record.id}` };
      updated = appendLifecycleEvent(updated, 'crm_synced', { simulated: true });
    }
  } else {
    updated = { ...updated, crm_ref: `crm_sim_${record.id}` };
    updated = appendLifecycleEvent(updated, 'crm_synced', { simulated: true });
  }

  const ticketPayload = buildTicketPayload(updated);
  const ticketValidation = validateTicketPayload(ticketPayload);
  if (!ticketValidation.valid) {
    throw new Error(ticketValidation.errors.join('; '));
  }

  if (!skipHttp) {
    try {
      const ticket = await createTicket(ticketValidation.payload);
      updated = { ...updated, ticket_ref: ticket.ticket_ref ?? ticket.id };
    } catch {
      updated = { ...updated, ticket_ref: `tkt_sim_${record.id}` };
    }
  } else {
    updated = { ...updated, ticket_ref: `tkt_sim_${record.id}` };
  }

  return appendLifecycleEvent(updated, 'ticket_created', {
    ticket_ref: updated.ticket_ref,
    owner: ticketPayload.owner_team,
  });
}
