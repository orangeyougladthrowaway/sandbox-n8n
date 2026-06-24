/** @typedef {'received'|'normalized'|'classified'|'ticket_created'|'crm_synced'|'customer_notified'|'reply_received'|'updated'|'closed'|'escalated'} LifecycleEventType */

/** @typedef {'DSAR'|'FORMAL'|'COMPLIANCE'|'LEGAL'|'SUPPORT_ONLY'} RequestedAction */

/**
 * @typedef {object} ComplaintRecord
 * @property {string} id
 * @property {string|null} external_ref
 * @property {'mailbox'|'scan'|'transcript'} channel
 * @property {string} received_at
 * @property {string} raw_artifact_path
 * @property {string} normalized_text
 * @property {string[]} attachments
 * @property {{ category: string, confidence: number, rationale: string }} classification
 * @property {RequestedAction[]} requested_actions
 * @property {{ score: number, label: string }} sentiment
 * @property {Array<{ type: LifecycleEventType, at: string, detail?: object }>} lifecycle_events
 * @property {string|null} crm_ref
 * @property {string|null} ticket_ref
 * @property {string|null} thread_id
 * @property {'open'|'pending'|'closed'|'escalated'} status
 */

export const REQUESTED_ACTIONS = [
  'DSAR',
  'FORMAL',
  'COMPLIANCE',
  'LEGAL',
  'SUPPORT_ONLY',
];

export const LIFECYCLE_EVENT_TYPES = [
  'received',
  'normalized',
  'classified',
  'ticket_created',
  'crm_synced',
  'customer_notified',
  'reply_received',
  'updated',
  'closed',
  'escalated',
];

export const COMPLAINT_CHANNELS = ['mailbox', 'scan', 'transcript'];

/**
 * Create an empty complaint record shell.
 * @param {Partial<ComplaintRecord>} [overrides]
 * @returns {ComplaintRecord}
 */
export function createComplaintRecord(overrides = {}) {
  return {
    id: overrides.id ?? '',
    external_ref: overrides.external_ref ?? null,
    channel: overrides.channel ?? 'mailbox',
    received_at: overrides.received_at ?? new Date().toISOString(),
    raw_artifact_path: overrides.raw_artifact_path ?? '',
    normalized_text: overrides.normalized_text ?? '',
    attachments: overrides.attachments ?? [],
    classification: overrides.classification ?? {
      category: 'unknown',
      confidence: 0,
      rationale: '',
    },
    requested_actions: overrides.requested_actions ?? [],
    sentiment: overrides.sentiment ?? { score: 0, label: 'neutral' },
    lifecycle_events: overrides.lifecycle_events ?? [],
    crm_ref: overrides.crm_ref ?? null,
    ticket_ref: overrides.ticket_ref ?? null,
    thread_id: overrides.thread_id ?? null,
    status: overrides.status ?? 'open',
  };
}

/**
 * Validate a complaint record shape (fail-fast).
 * @param {unknown} record
 * @returns {{ valid: true, record: ComplaintRecord } | { valid: false, errors: string[] }}
 */
export function validateComplaintRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['Record must be an object'] };
  }
  const r = /** @type {ComplaintRecord} */ (record);

  if (!r.id || typeof r.id !== 'string') {
    errors.push('id is required');
  }
  if (!COMPLAINT_CHANNELS.includes(r.channel)) {
    errors.push(`channel must be one of: ${COMPLAINT_CHANNELS.join(', ')}`);
  }
  if (typeof r.normalized_text !== 'string') {
    errors.push('normalized_text must be a string');
  }
  if (!Array.isArray(r.requested_actions)) {
    errors.push('requested_actions must be an array');
  }
  for (const action of r.requested_actions) {
    if (!REQUESTED_ACTIONS.includes(action)) {
      errors.push(`invalid requested_action: ${action}`);
    }
  }
  if (!r.classification || typeof r.classification.category !== 'string') {
    errors.push('classification.category is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, record: r };
}

/**
 * Append a lifecycle event (immutable append).
 * @param {ComplaintRecord} record
 * @param {LifecycleEventType} type
 * @param {object} [detail]
 * @returns {ComplaintRecord}
 */
export function appendLifecycleEvent(record, type, detail = {}) {
  if (!LIFECYCLE_EVENT_TYPES.includes(type)) {
    throw new Error(`Unknown lifecycle event type: ${type}`);
  }
  return {
    ...record,
    lifecycle_events: [
      ...record.lifecycle_events,
      { type, at: new Date().toISOString(), detail },
    ],
  };
}
