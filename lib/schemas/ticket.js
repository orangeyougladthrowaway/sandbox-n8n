/**
 * Unified ticket model for all programs (complaints, servicedesk, daily-checks, daily-ops).
 */

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const TICKET_STATUSES = [
  'new',
  'open',
  'in_progress',
  'in_bot_triage',
  'awaiting_user',
  'ready_for_handoff',
  'with_technician',
  'closed',
];
export const SOURCE_PROGRAMS = ['complaints', 'servicedesk', 'daily-checks', 'daily-ops'];

/**
 * @typedef {object} TicketPayload
 * @property {string} title
 * @property {string} description
 * @property {'low'|'medium'|'high'|'critical'} priority
 * @property {string} source_ref
 * @property {string} owner_team
 * @property {'complaints'|'servicedesk'|'daily-checks'|'daily-ops'} [source_program]
 * @property {string} [status]
 * @property {string|null} [assignee]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * Validate ticket payload before mock API post.
 * @param {unknown} payload
 * @returns {{ valid: true, payload: TicketPayload } | { valid: false, errors: string[] }}
 */
export function validateTicketPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['payload must be an object'] };
  }
  const p = /** @type {TicketPayload} */ (payload);
  if (!p.title || typeof p.title !== 'string') {
    errors.push('title is required');
  }
  if (!p.description || typeof p.description !== 'string') {
    errors.push('description is required');
  }
  if (!TICKET_PRIORITIES.includes(p.priority)) {
    errors.push(`priority must be one of: ${TICKET_PRIORITIES.join(', ')}`);
  }
  if (!p.source_ref) {
    errors.push('source_ref is required');
  }
  if (!p.owner_team) {
    errors.push('owner_team is required');
  }
  if (p.source_program && !SOURCE_PROGRAMS.includes(p.source_program)) {
    errors.push(`source_program must be one of: ${SOURCE_PROGRAMS.join(', ')}`);
  }
  if (p.status && !TICKET_STATUSES.includes(p.status)) {
    errors.push(`status must be one of: ${TICKET_STATUSES.join(', ')}`);
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, payload: p };
}

/**
 * @param {Partial<TicketPayload>} [overrides]
 * @returns {TicketPayload}
 */
export function createTicketPayload(overrides = {}) {
  return {
    title: overrides.title ?? 'Untitled ticket',
    description: overrides.description ?? '',
    priority: overrides.priority ?? 'medium',
    source_ref: overrides.source_ref ?? `ref_${Date.now()}`,
    owner_team: overrides.owner_team ?? 'support-team',
    source_program: overrides.source_program ?? 'servicedesk',
    status: overrides.status ?? 'new',
    assignee: overrides.assignee ?? null,
    metadata: overrides.metadata ?? {},
  };
}
