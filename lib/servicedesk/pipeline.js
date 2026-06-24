import fs from 'node:fs';
import path from 'node:path';
import {
  INBOUND_SERVICEDESK_CHAT,
  OUTBOUND_SERVICEDESK_CHAT,
  SMOKE_ROOT,
  DEFAULT_BOT_TECH_ID,
} from '../core/paths.js';
import { assertWritePathUnderDataRoot } from '../core/sandbox.js';
import { FileServiceDeskStore } from './store.js';
import { pollBotQueue, pickNextTicket } from './queue.js';
import { classifyTicket } from './classify.js';
import { triageTicket } from './triage.js';
import { analyzeKb } from './kb.js';
import {
  appendConversationTurn,
  evaluateConversation,
} from './conversation.js';
import { generateElicitationMessage } from './elicitation.js';
import { handoffToTechnician } from './handoff.js';
import { appendLifecycleEvent } from '../schemas/servicedesk-ticket.js';

/**
 * Write bot chat message to outbound file sim.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {string} text
 * @param {string} [outDir]
 */
export function writeBotChatFile(ticket, text, outDir = OUTBOUND_SERVICEDESK_CHAT) {
  const dir = outDir;
  assertWritePathUnderDataRoot(dir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${ticket.id}-bot-${Date.now()}.json`);
  assertWritePathUnderDataRoot(file);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        ticket_id: ticket.id,
        external_ref: ticket.external_ref,
        actor: 'bot',
        text,
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
  return file;
}

/**
 * Read pending user chat replies from inbound folder.
 * @param {string} ticketId
 * @param {string} [inDir]
 * @returns {{ text: string, file: string }|null}
 */
export function readUserChatReply(ticketId, inDir = INBOUND_SERVICEDESK_CHAT) {
  if (!fs.existsSync(inDir)) {
    return null;
  }
  const files = fs
    .readdirSync(inDir)
    .filter((f) => f.startsWith(ticketId) && f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    return null;
  }
  const file = path.join(inDir, files[0]);
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.unlinkSync(file);
  return { text: payload.text, file };
}

/**
 * Process one ticket through classify → triage → KB → bot/handoff cycle.
 * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
 * @param {FileServiceDeskStore} store
 * @param {{ skipHttp?: boolean, outDir?: string, inDir?: string, fixtureId?: string }} [options]
 * @returns {Promise<import('../schemas/servicedesk-ticket.js').ServiceDeskTicket>}
 */
export async function processTicketCycle(ticket, store, options = {}) {
  let current = ticket;
  if (!current.assignment.bot_technician_id) {
    current = {
      ...current,
      assignment: {
        ...current.assignment,
        bot_technician_id: DEFAULT_BOT_TECH_ID,
        current_assignee: DEFAULT_BOT_TECH_ID,
      },
    };
    current = appendLifecycleEvent(current, 'bot_assigned', {
      assignee: DEFAULT_BOT_TECH_ID,
    });
  }

  if (current.status === 'new') {
    current = classifyTicket(current, { fixtureId: options.fixtureId });
    store.upsertTicket(current);
    current = triageTicket(current);
    store.upsertTicket(current);
    current = await analyzeKb(current, { skipHttp: options.skipHttp });
    store.upsertTicket(current);
  }

  const userReply = readUserChatReply(current.id, options.inDir);
  if (userReply) {
    const elicitation = generateElicitationMessage(current);
    current = appendConversationTurn(current, {
      actor: 'user',
      text: userReply.text,
      intent: 'reply',
    });
    store.upsertTicket(current);
  }

  const decision = evaluateConversation(current);

  if (decision.action === 'handoff') {
    current = handoffToTechnician(current, decision.reason);
    store.upsertTicket(current);
    return current;
  }

  if (decision.action === 'complete') {
    current = { ...current, status: 'closed' };
    current = appendLifecycleEvent(current, 'closed', { reason: decision.reason });
    store.upsertTicket(current);
    return current;
  }

  if (decision.action === 'bot_reply') {
    const msg = generateElicitationMessage(current);
    current = appendConversationTurn(current, {
      actor: 'bot',
      text: msg.text,
      intent: msg.intent,
    });
    current = { ...current, status: 'awaiting_user' };
    if (msg.complete) {
      current = appendLifecycleEvent(current, 'elicitation_complete', {});
    }
    writeBotChatFile(current, msg.text, options.outDir);
    store.upsertTicket(current);
  }

  return current;
}

/**
 * Run queue poller: pick highest priority ticket and process one cycle.
 * @param {FileServiceDeskStore} store
 * @param {{ skipHttp?: boolean, outDir?: string, inDir?: string }} [options]
 * @returns {Promise<import('../schemas/servicedesk-ticket.js').ServiceDeskTicket|null>}
 */
export async function runQueuePoller(store, options = {}) {
  const queue = await pollBotQueue({ skipHttp: options.skipHttp });
  for (const t of queue) {
    if (!store.getTicket(t.id)) {
      store.upsertTicket(t);
    }
  }
  const next = pickNextTicket(store.listTickets().length ? store.listTickets() : queue);
  if (!next) {
    return null;
  }
  return processTicketCycle(next, store, options);
}

/**
 * @returns {string}
 */
export function serviceDeskSmokeRoot() {
  return path.join(SMOKE_ROOT, 'servicedesk');
}

/**
 * @returns {Promise<{ passed: number, scenarios: object[] }>}
 */
export async function runServiceDeskSmoke() {
  const root = serviceDeskSmokeRoot();
  fs.rmSync(root, { recursive: true, force: true });
  const outChat = path.join(root, 'outbound', 'chat');
  const inChat = path.join(root, 'inbound', 'chat');
  const dbFile = path.join(root, 'servicedesk-db.json');
  fs.mkdirSync(inChat, { recursive: true });

  const store = new FileServiceDeskStore(dbFile);
  const scenarios = [];

  // Scenario 1: vague VPN → bot question → user reply → handoff
  const vpnQueue = await pollBotQueue({ skipHttp: true });
  const vpn = vpnQueue.find((t) => t.id.includes('vague-vpn') || t.summary.toLowerCase().includes('vpn'));
  if (!vpn) throw new Error('Smoke: vague-vpn fixture missing');
  store.upsertTicket(vpn);
  let t1 = await processTicketCycle(vpn, store, {
    skipHttp: true,
    outDir: outChat,
    inDir: inChat,
    fixtureId: 'vague-vpn',
  });
  scenarios.push({
    name: 'vague-vpn-bot-question',
    ok: t1.status === 'awaiting_user' && t1.conversation.some((c) => c.actor === 'bot'),
  });

  fs.writeFileSync(
    path.join(inChat, `${t1.id}-user-reply.json`),
    JSON.stringify({ text: 'Error code 809, started this morning. speak to a person please.' }),
    'utf8',
  );
  t1 = await processTicketCycle(t1, store, {
    skipHttp: true,
    outDir: outChat,
    inDir: inChat,
  });
  scenarios.push({
    name: 'vague-vpn-handoff',
    ok: t1.status === 'with_technician',
  });

  // Scenario 2: clear password reset
  const pwd = vpnQueue.find((t) => t.summary.toLowerCase().includes('password'));
  if (!pwd) throw new Error('Smoke: password fixture missing');
  const t2 = await processTicketCycle(pwd, store, {
    skipHttp: true,
    outDir: outChat,
    inDir: inChat,
    fixtureId: 'clear-password-reset',
  });
  scenarios.push({
    name: 'clear-password-short-path',
    ok: ['awaiting_user', 'with_technician', 'closed'].includes(t2.status),
  });

  // Scenario 3: existing awaiting_user ticket
  const awaiting = vpnQueue.find((t) => t.status === 'awaiting_user');
  if (awaiting) {
    store.upsertTicket(awaiting);
    fs.writeFileSync(
      path.join(inChat, `${awaiting.id}-user-reply.json`),
      JSON.stringify({ text: 'I tried rebooting, still broken.' }),
      'utf8',
    );
    const t3 = await processTicketCycle(awaiting, store, {
      skipHttp: true,
      outDir: outChat,
      inDir: inChat,
    });
    scenarios.push({
      name: 'existing-awaiting-resumed',
      ok: t3.conversation.some((c) => c.actor === 'user'),
    });
  }

  // Scenario 4: priority ordering
  const critical = vpnQueue.find((t) => t.priority === 'critical');
  const medium = vpnQueue.find((t) => t.priority === 'medium' && t.status === 'new');
  if (critical && medium) {
    const picked = pickNextTicket([medium, critical]);
    scenarios.push({
      name: 'priority-critical-first',
      ok: picked?.priority === 'critical',
    });
  }

  fs.rmSync(root, { recursive: true, force: true });
  return { passed: scenarios.filter((s) => s.ok).length, scenarios };
}
