import { appendLifecycleEvent } from '../schemas/servicedesk-ticket.js';
import { detectGaps, userRequestedHandoff } from './elicitation.js';

export const MAX_BOT_TURNS = 5;

/**
 * Decide next conversation action.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @returns {{ action: 'bot_reply'|'handoff'|'await_user'|'complete', reason: string }}
 */
export function evaluateConversation(ticket) {
  const botTurns = ticket.conversation.filter((t) => t.actor === 'bot').length;
  const lastUser = [...ticket.conversation].reverse().find((t) => t.actor === 'user');

  if (lastUser && userRequestedHandoff(lastUser.text)) {
    return { action: 'handoff', reason: 'user_requested_human' };
  }

  if (ticket.priority === 'critical' && ticket.kb_matches.length === 0) {
    return { action: 'handoff', reason: 'critical_low_kb_confidence' };
  }

  if (botTurns >= MAX_BOT_TURNS) {
    return { action: 'handoff', reason: 'max_turns_exceeded' };
  }

  const gaps = detectGaps(ticket);
  if (gaps.length === 0 && lastUser?.text.toLowerCase().includes('yes')) {
    return { action: 'complete', reason: 'user_confirmed_fix' };
  }

  if (gaps.length === 0 && botTurns >= 1) {
    return { action: 'handoff', reason: 'elicitation_complete' };
  }

  if (ticket.status === 'awaiting_user' && !lastUser) {
    return { action: 'await_user', reason: 'waiting_for_reply' };
  }

  return { action: 'bot_reply', reason: 'needs_more_detail' };
}

/**
 * Append conversation turn.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {{ actor: string, text: string, intent?: string, metadata?: object }} turn
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket}
 */
export function appendConversationTurn(ticket, turn) {
  const entry = {
    at: new Date().toISOString(),
    actor: turn.actor,
    channel: 'servicedesk_chat',
    text: turn.text,
    intent: turn.intent,
    metadata: turn.metadata ?? {},
  };
  let updated = {
    ...ticket,
    conversation: [...ticket.conversation, entry],
  };
  const eventType =
    turn.actor === 'bot' ? 'user_message_sent' : turn.actor === 'user' ? 'user_reply_received' : 'updated';
  updated = appendLifecycleEvent(updated, eventType, { intent: turn.intent });
  return updated;
}
