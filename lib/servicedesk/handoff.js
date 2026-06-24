import { appendLifecycleEvent } from '../schemas/servicedesk-ticket.js';

/**
 * Build handoff summary for human technician.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {string} reason
 * @returns {string}
 */
export function buildHandoffSummary(ticket, reason) {
  const kb = ticket.kb_matches.map((m) => m.title).join(', ') || 'none';
  const turns = ticket.conversation.length;
  return [
    `Handoff: ${reason}`,
    `Category: ${ticket.classification.category} (${ticket.priority})`,
    `Queue: ${ticket.triage.queue} → ${ticket.triage.owner_team}`,
    `KB matches: ${kb}`,
    `Conversation turns: ${turns}`,
    `Summary: ${ticket.summary}`,
  ].join('\n');
}

/**
 * Execute handoff to human technician queue.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {string} reason
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket}
 */
export function handoffToTechnician(ticket, reason) {
  const summary = buildHandoffSummary(ticket, reason);
  const now = new Date().toISOString();
  let updated = {
    ...ticket,
    status: 'with_technician',
    assignment: {
      bot_technician_id: ticket.assignment.bot_technician_id,
      current_assignee: ticket.triage.owner_team,
      handoff_at: now,
      handoff_reason: reason,
    },
  };
  updated = appendLifecycleEvent(updated, 'handoff_to_technician', { reason, summary });
  updated = appendLifecycleEvent(updated, 'technician_assigned', {
    assignee: ticket.triage.owner_team,
  });
  return updated;
}
