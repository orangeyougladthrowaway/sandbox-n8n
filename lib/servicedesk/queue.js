import fs from 'node:fs';
import path from 'node:path';
import { pollTicketsForAssignee } from '../simulators/ticketing.js';
import { defaultSkipHttp } from '../core/sandbox.js';
import { DEFAULT_BOT_TECH_ID, FIXTURES_DIR } from '../core/paths.js';
import { normalizeTicketPayload } from './intake.js';
import { prioritySortKey } from './triage.js';

/**
 * Poll unified ticket API for bot-assigned work items.
 * @param {{ assignee?: string, skipHttp?: boolean }} [options]
 * @returns {Promise<import('../schemas/servicedesk-ticket.js').ServiceDeskTicket[]>}
 */
export async function pollBotQueue(options = {}) {
  const assignee = options.assignee ?? DEFAULT_BOT_TECH_ID;
  const skipHttp = defaultSkipHttp(options.skipHttp);

  if (!skipHttp) {
    try {
      const apiTickets = await pollTicketsForAssignee(assignee, {
        source_program: 'servicedesk',
      });
      return apiTickets.map((raw) =>
        normalizeTicketPayload({
          ...raw,
          external_ref: raw.ticket_ref,
          summary: raw.title,
          assignment: {
            bot_technician_id: assignee,
            current_assignee: raw.assignee,
            handoff_at: null,
            handoff_reason: null,
          },
        }),
      );
    } catch {
      // fall through to fixtures
    }
  }

  return loadFixtureQueue();
}

/**
 * Load fixture tickets for offline smoke/demo.
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket[]}
 */
export function loadFixtureQueue() {
  const dir = path.join(FIXTURES_DIR, 'servicedesk', 'tickets');
  if (!fs.existsSync(dir)) {
    return [];
  }
  const tickets = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return normalizeTicketPayload(raw);
    });
  return tickets.sort((a, b) => prioritySortKey(a) - prioritySortKey(b));
}

/**
 * Pick next ticket from queue (priority order).
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket[]} queue
 * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket|undefined}
 */
export function pickNextTicket(queue) {
  const open = queue.filter((t) =>
    ['new', 'in_bot_triage', 'awaiting_user'].includes(t.status),
  );
  open.sort((a, b) => prioritySortKey(a) - prioritySortKey(b));
  return open[0];
}
