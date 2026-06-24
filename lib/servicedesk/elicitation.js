import fs from 'node:fs';
import path from 'node:path';
import { PROMPTS_DIR } from '../core/paths.js';

const HANDOFF_PHRASES = [
  'speak to a person',
  'talk to a human',
  'real technician',
  'escalate to human',
];

/**
 * Load elicitation prompt template.
 * @param {string} name
 * @returns {string}
 */
export function loadPrompt(name) {
  const file = path.join(PROMPTS_DIR, 'servicedesk', `${name}.md`);
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8');
  }
  return `Please provide more detail about: {{topic}}`;
}

/**
 * Detect gaps in ticket detail for elicitation.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @returns {string[]}
 */
export function detectGaps(ticket) {
  const text = `${ticket.summary} ${ticket.description}`.toLowerCase();
  const gaps = [];
  if (text.includes('vpn') && !text.includes('error')) {
    gaps.push('error message or symptom');
  }
  if (text.includes('vpn') && !text.includes('when')) {
    gaps.push('when the issue started');
  }
  if (text.includes('password') && text.includes('reset')) {
    return []; // clear enough
  }
  if (ticket.summary.length < 20) {
    gaps.push('a clearer summary of the issue');
  }
  if (gaps.length === 0 && ticket.kb_matches.length === 0) {
    gaps.push('steps already attempted');
  }
  return gaps;
}

/**
 * Generate next bot elicitation message.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @returns {{ text: string, intent: string, complete: boolean }}
 */
export function generateElicitationMessage(ticket) {
  const gaps = detectGaps(ticket);
  if (gaps.length === 0) {
    const kbTitle = ticket.kb_matches[0]?.title ?? 'the documented procedure';
    return {
      text: `Based on ${kbTitle}, can you confirm you've tried the standard steps? Reply yes to proceed or share any blockers.`,
      intent: 'confirm',
      complete: true,
    };
  }
  const topic = gaps[0];
  const template = loadPrompt('elicitation');
  return {
    text: template.replace('{{topic}}', topic),
    intent: 'elicit',
    complete: false,
  };
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function userRequestedHandoff(text) {
  const lower = (text || '').toLowerCase();
  return HANDOFF_PHRASES.some((p) => lower.includes(p));
}
