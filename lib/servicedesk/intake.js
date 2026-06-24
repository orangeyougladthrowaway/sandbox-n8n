import {
  createServiceDeskTicket,
  validateServiceDeskTicket,
  appendLifecycleEvent,
} from '../schemas/servicedesk-ticket.js';

/**
 * Normalize API ticket or fixture JSON into ServiceDeskTicket.
 * @param {object} raw
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket}
 */
export function normalizeTicketPayload(raw) {
  const ticket = createServiceDeskTicket({
    id: raw.id ?? raw.ticket_id,
    external_ref: raw.external_ref ?? raw.ticket_ref ?? null,
    status: raw.status ?? 'new',
    priority: raw.priority ?? 'medium',
    category: raw.category ?? 'request',
    summary: raw.summary ?? raw.title ?? '',
    description: raw.description ?? '',
    requester: raw.requester ?? {
      id: raw.requester_id ?? 'user@example.invalid',
      display_name: raw.requester_name ?? 'Sandbox User',
      channel: 'servicedesk_chat',
    },
    classification: raw.classification,
    triage: raw.triage,
    kb_matches: raw.kb_matches ?? [],
    conversation: raw.conversation ?? [],
    assignment: raw.assignment,
    lifecycle_events: raw.lifecycle_events,
    linked_systems: raw.linked_systems ?? [],
  });
  const validation = validateServiceDeskTicket(ticket);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }
  return validation.ticket;
}

/**
 * Sync external_ref from unified ticket API record.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {object} apiTicket
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket}
 */
export function linkExternalTicket(ticket, apiTicket) {
  return {
    ...ticket,
    external_ref: apiTicket.ticket_ref ?? apiTicket.id,
    assignment: {
      ...ticket.assignment,
      current_assignee: apiTicket.assignee ?? ticket.assignment.current_assignee,
    },
  };
}

export { appendLifecycleEvent, validateServiceDeskTicket };
