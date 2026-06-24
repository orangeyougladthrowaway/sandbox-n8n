import { newId } from '../core/logging.js';

export const SD_STATUSES = [
  'new',
  'in_bot_triage',
  'awaiting_user',
  'ready_for_handoff',
  'with_technician',
  'closed',
];
export const SD_CATEGORIES = ['incident', 'request', 'problem', 'change'];
export const CONVERSATION_ACTORS = ['bot', 'user', 'technician', 'system'];
export const LIFECYCLE_EVENT_TYPES = [
  'received',
  'classified',
  'triaged',
  'kb_analyzed',
  'bot_assigned',
  'user_message_sent',
  'user_reply_received',
  'elicitation_complete',
  'handoff_to_technician',
  'technician_assigned',
  'updated',
  'closed',
];

/**
 * @typedef {object} ConversationTurn
 * @property {string} at
 * @property {'bot'|'user'|'technician'|'system'} actor
 * @property {string} channel
 * @property {string} text
 * @property {string} [intent]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {object} ServiceDeskTicket
 * @property {string} id
 * @property {string|null} external_ref
 * @property {string} status
 * @property {'critical'|'high'|'medium'|'low'} priority
 * @property {string} category
 * @property {{ category: string, confidence: number, rationale: string }} classification
 * @property {{ queue: string, owner_team: string, suggested_action: string, sla_bucket: string }} triage
 * @property {{ id: string, display_name: string, channel: string }} requester
 * @property {string} summary
 * @property {string} description
 * @property {{ doc_id: string, title: string, excerpt: string, score: number }[]} kb_matches
 * @property {ConversationTurn[]} conversation
 * @property {{ bot_technician_id: string|null, current_assignee: string|null, handoff_at: string|null, handoff_reason: string|null }} assignment
 * @property {{ type: string, at: string, detail?: object }[]} lifecycle_events
 * @property {string[]} linked_systems
 */

/**
 * @param {Partial<ServiceDeskTicket>} [overrides]
 * @returns {ServiceDeskTicket}
 */
export function createServiceDeskTicket(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? newId('sd'),
    external_ref: overrides.external_ref ?? null,
    status: overrides.status ?? 'new',
    priority: overrides.priority ?? 'medium',
    category: overrides.category ?? 'request',
    classification: overrides.classification ?? {
      category: 'request',
      confidence: 0.5,
      rationale: 'default',
    },
    triage: overrides.triage ?? {
      queue: 'l1-general',
      owner_team: 'support-team',
      suggested_action: 'triage',
      sla_bucket: 'standard',
    },
    requester: overrides.requester ?? {
      id: 'user@example.invalid',
      display_name: 'Sandbox User',
      channel: 'servicedesk_chat',
    },
    summary: overrides.summary ?? '',
    description: overrides.description ?? '',
    kb_matches: overrides.kb_matches ?? [],
    conversation: overrides.conversation ?? [],
    assignment: overrides.assignment ?? {
      bot_technician_id: null,
      current_assignee: null,
      handoff_at: null,
      handoff_reason: null,
    },
    lifecycle_events: overrides.lifecycle_events ?? [{ type: 'received', at: now }],
    linked_systems: overrides.linked_systems ?? [],
  };
}

/**
 * @param {ServiceDeskTicket} ticket
 * @param {string} type
 * @param {object} [detail]
 * @returns {ServiceDeskTicket}
 */
export function appendLifecycleEvent(ticket, type, detail = {}) {
  return {
    ...ticket,
    lifecycle_events: [
      ...ticket.lifecycle_events,
      { type, at: new Date().toISOString(), detail },
    ],
  };
}

/**
 * @param {unknown} ticket
 * @returns {{ valid: true, ticket: ServiceDeskTicket } | { valid: false, errors: string[] }}
 */
export function validateServiceDeskTicket(ticket) {
  const errors = [];
  if (!ticket || typeof ticket !== 'object') {
    return { valid: false, errors: ['ticket must be an object'] };
  }
  const t = /** @type {ServiceDeskTicket} */ (ticket);
  if (!t.id) errors.push('id is required');
  if (!SD_STATUSES.includes(t.status)) errors.push(`invalid status: ${t.status}`);
  if (!t.summary && !t.description) errors.push('summary or description required');
  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, ticket: t };
}
