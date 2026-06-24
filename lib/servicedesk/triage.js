import { appendLifecycleEvent } from '../schemas/servicedesk-ticket.js';

const QUEUE_MAP = {
  incident: { queue: 'l1-incidents', owner_team: 'network-team', sla_bucket: 'urgent' },
  request: { queue: 'l1-requests', owner_team: 'support-team', sla_bucket: 'standard' },
  problem: { queue: 'l2-problems', owner_team: 'platform-team', sla_bucket: 'extended' },
  change: { queue: 'change-advisory', owner_team: 'change-team', sla_bucket: 'planned' },
};

/**
 * Triage classified ticket into queue and owner team.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket}
 */
export function triageTicket(ticket) {
  const mapping = QUEUE_MAP[ticket.classification.category] ?? QUEUE_MAP.request;
  const triage = {
    queue: mapping.queue,
    owner_team: mapping.owner_team,
    suggested_action:
      ticket.priority === 'critical' ? 'escalate_immediately' : 'bot_elicitation',
    sla_bucket: ticket.priority === 'critical' ? 'critical' : mapping.sla_bucket,
  };
  const updated = {
    ...ticket,
    triage,
    status: ticket.status === 'new' ? 'in_bot_triage' : ticket.status,
  };
  return appendLifecycleEvent(updated, 'triaged', triage);
}

/**
 * Priority sort key (lower = higher priority).
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @returns {number}
 */
export function prioritySortKey(ticket) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[ticket.priority] ?? 99;
}
