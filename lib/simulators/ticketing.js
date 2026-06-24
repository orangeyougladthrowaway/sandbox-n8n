import { getJson, patchJson, postJson } from '../core/http.js';

/**
 * Create ticket via unified mock ticketing API.
 * @param {import('../schemas/ticket.js').TicketPayload} payload
 * @returns {Promise<object>}
 */
export async function createTicket(payload) {
  return postJson('/tickets', payload);
}

/**
 * List tickets with query filters.
 * @param {{ assignee?: string, status?: string, source_program?: string, sort?: string, since?: string }} [query]
 * @returns {Promise<object[]>}
 */
export async function listTickets(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  const result = await getJson(qs ? `/tickets?${qs}` : '/tickets');
  return result.items ?? [];
}

/**
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getTicket(id) {
  return getJson(`/tickets/${encodeURIComponent(id)}`);
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object>}
 */
export async function updateTicket(id, patch) {
  return patchJson(`/tickets/${encodeURIComponent(id)}`, patch);
}

/**
 * @param {string} id
 * @param {{ author: string, text: string }} comment
 * @returns {Promise<object>}
 */
export async function addTicketComment(id, comment) {
  return postJson(`/tickets/${encodeURIComponent(id)}/comments`, comment);
}

/**
 * Poll open tickets assigned to a technician persona (priority order).
 * @param {string} assignee
 * @param {{ status?: string, source_program?: string }} [options]
 * @returns {Promise<object[]>}
 */
export async function pollTicketsForAssignee(assignee, options = {}) {
  return listTickets({
    assignee,
    status: options.status ?? 'new,open,in_bot_triage,awaiting_user',
    source_program: options.source_program,
    sort: 'priority',
  });
}
