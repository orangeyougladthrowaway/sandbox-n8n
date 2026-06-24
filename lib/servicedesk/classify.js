import { analyzeText } from '../simulators/aiClient.js';
import { appendLifecycleEvent } from '../schemas/servicedesk-ticket.js';

const KEYWORD_RULES = [
  { keywords: ['vpn', 'network', 'cannot connect', 'wifi'], category: 'incident', priority: 'high' },
  { keywords: ['password', 'reset', 'locked out'], category: 'request', priority: 'medium' },
  { keywords: ['email', 'outlook', 'mailbox'], category: 'incident', priority: 'medium' },
  { keywords: ['critical', 'outage', 'down'], category: 'incident', priority: 'critical' },
];

/**
 * Classify service desk ticket (deterministic sim AI).
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {{ fixtureId?: string }} [options]
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket}
 */
export function classifyTicket(ticket, options = {}) {
  const text = `${ticket.summary} ${ticket.description}`.toLowerCase();
  let category = 'request';
  let priority = ticket.priority;
  let rationale = 'Default service desk classification';

  if (options.fixtureId === 'vague-vpn') {
    category = 'incident';
    priority = 'high';
    rationale = 'Fixture: vague VPN connectivity issue';
  } else if (options.fixtureId === 'clear-password-reset') {
    category = 'request';
    priority = 'medium';
    rationale = 'Fixture: clear password reset request';
  } else if (options.fixtureId === 'critical-outage') {
    category = 'incident';
    priority = 'critical';
    rationale = 'Fixture: critical outage';
  } else {
    for (const rule of KEYWORD_RULES) {
      if (rule.keywords.some((kw) => text.includes(kw))) {
        category = rule.category;
        priority = rule.priority;
        rationale = `Keyword match: ${rule.keywords[0]}`;
        break;
      }
    }
    const ai = analyzeText(text);
    if (ai.classification.confidence > 0.7 && category === 'request') {
      category = ai.classification.category === 'support' ? 'request' : 'incident';
    }
  }

  const updated = {
    ...ticket,
    category,
    priority,
    classification: {
      category,
      confidence: 0.8,
      rationale,
    },
  };
  return appendLifecycleEvent(updated, 'classified', updated.classification);
}
