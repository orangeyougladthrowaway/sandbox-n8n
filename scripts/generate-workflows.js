import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function wf(name, code, pos = [260, 0], codeNodeName = 'Run lib') {
  const id = () => randomUUID();
  return {
    name,
    nodes: [
      {
        parameters: {
          content: `## ${name}\n\nThin workflow — logic in lib/`,
          height: 140,
          width: 360,
        },
        id: id(),
        name: 'Sticky Note',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [-80, -120],
      },
      {
        parameters: {},
        id: id(),
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [0, 0],
      },
      {
        parameters: { mode: 'runOnceForAllItems', jsCode: code },
        id: id(),
        name: codeNodeName,
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: pos,
      },
    ],
    connections: {
      'Manual Trigger': { main: [[{ node: codeNodeName, type: 'main', index: 0 }]] },
    },
    active: false,
    settings: { executionOrder: 'v1' },
    versionId: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    meta: { instanceId: 'sandbox-n8n' },
  };
}

/** n8n Code node sandbox blocks dynamic import(); use require + createRequire. */
const header = `const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');
const req = createRequire(path.join(process.env.N8N_REPO_ROOT ?? 'C:/repos/sandbox-n8n', 'package.json'));
const lib = req(path.join(process.env.N8N_REPO_ROOT ?? 'C:/repos/sandbox-n8n', 'lib', 'index.js'));
const repoRoot = lib.REPO_ROOT;
const dataRoot = lib.DATA_ROOT;
`;

const defs = [
  [
    'workflows/_shared/create-ticket.json',
    'Shared Create Ticket',
    `${header}const { createTicketPayload, validateTicketPayload, createTicket } = lib;
const payload = createTicketPayload({ title: 'Shared test', description: 'POC', priority: 'medium', source_ref: 'shared_1', source_program: 'servicedesk' });
const v = validateTicketPayload(payload);
if (!v.valid) throw new Error(v.errors.join('; '));
try { const t = await createTicket(v.payload); return [{ json: t }]; } catch { return [{ json: { ticket_ref: 'tkt_sim_shared', simulated: true } }]; }`,
  ],
  [
    'workflows/_shared/kb-search.json',
    'Shared KB Search',
    `${header}const { searchKbFixtures } = lib;
return [{ json: { items: searchKbFixtures('vpn') } }];`,
  ],
  [
    'workflows/_shared/call-ai-sim.json',
    'Shared Call AI Sim',
    `${header}const { analyzeText } = lib;
return [{ json: analyzeText('subject access request') }];`,
  ],
  [
    'workflows/_shared/send-notification.json',
    'Shared Send Notification',
    `${header}const out = path.join(dataRoot, 'outbound', 'sent', 'shared-notify.txt');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, 'notification sim');
return [{ json: { path: out } }];`,
  ],
  [
    'workflows/_shared/log-lifecycle-event.json',
    'Shared Log Lifecycle Event',
    `${header}const { logEvent } = lib;
return [{ json: logEvent('workflow', 'shared_event', { ok: true }) }];`,
  ],
  [
    'workflows/complaints/complaints-classify.json',
    'Complaints Classify',
    `${header}const { normalizeInboundArtifact, classifyComplaint } = lib;
const fp = path.join(repoRoot, 'fixtures', 'complaints', 'formal-dsar.eml');
const record = classifyComplaint(normalizeInboundArtifact(fp, fs.readFileSync(fp, 'utf8')));
return [{ json: record }];`,
  ],
  [
    'workflows/complaints/complaints-route.json',
    'Complaints Route',
    `${header}const { createComplaintRecord, routeComplaint } = lib;
let r = createComplaintRecord({ id: 'cmp_route_demo', normalized_text: 'FCA compliance issue', classification: { category: 'compliance', confidence: 0.9, rationale: 'demo' }, requested_actions: ['COMPLIANCE'] });
r = await routeComplaint(r, { skipHttp: true });
return [{ json: r }];`,
  ],
  [
    'workflows/complaints/complaints-notify-customer.json',
    'Complaints Notify Customer',
    `${header}const { createComplaintRecord, notifyCustomer } = lib;
const r = createComplaintRecord({ id: 'cmp_notify', normalized_text: 'test', thread_id: 'thread-demo' });
return [{ json: notifyCustomer(r, { outDir: path.join(dataRoot, 'outbound', 'sent') }).record }];`,
  ],
  [
    'workflows/complaints/complaints-monitor-replies.json',
    'Complaints Monitor Replies',
    `${header}const { FileComplaintStore, processReplyFile, createComplaintRecord } = lib;
const db = path.join(dataRoot, '_runtime', 'complaints-reply-demo.json');
const store = new FileComplaintStore(db);
store.upsertComplaint(createComplaintRecord({ id: 'cmp_reply', thread_id: 'thread-reply-demo' }));
const reply = path.join(dataRoot, 'inbound', 'mailbox', 'replies', 'demo-reply.eml');
fs.mkdirSync(path.dirname(reply), { recursive: true });
fs.writeFileSync(reply, 'Thread-ID: thread-reply-demo\\n\\nStill unhappy');
return [{ json: processReplyFile(reply, store) }];`,
  ],
  [
    'workflows/complaints/complaints-intake.json',
    'Complaints Intake',
    `${header}const { FileComplaintStore, processComplaintFile } = lib;
const fixture = path.join(repoRoot, 'fixtures', 'complaints', 'angry-support.eml');
const dest = path.join(dataRoot, 'inbound', 'mailbox', 'angry-support.eml');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(fixture, dest);
const dbFile = path.join(dataRoot, '_runtime', 'complaints-db.json');
const store = new FileComplaintStore(dbFile);
const record = await processComplaintFile(dest, store);
return [{ json: record }];`,
    [260, 0],
    'Process fixture complaint',
  ],
  [
    'workflows/servicedesk/sd-queue-poller.json',
    'SD Queue Poller',
    `${header}const { FileServiceDeskStore, runQueuePoller } = lib;
const store = new FileServiceDeskStore(path.join(dataRoot, '_runtime', 'servicedesk-db.json'));
const result = await runQueuePoller(store, { skipHttp: true });
return [{ json: result ?? { message: 'no tickets' } }];`,
  ],
  [
    'workflows/servicedesk/sd-intake.json',
    'SD Intake',
    `${header}const { normalizeTicketPayload } = lib;
const raw = JSON.parse(fs.readFileSync(path.join(repoRoot, 'fixtures', 'servicedesk', 'tickets', 'vague-vpn.json'), 'utf8'));
return [{ json: normalizeTicketPayload(raw) }];`,
  ],
  [
    'workflows/servicedesk/sd-classify-triage.json',
    'SD Classify Triage',
    `${header}const { normalizeTicketPayload, classifyTicket, triageTicket, analyzeKb } = lib;
let t = normalizeTicketPayload(JSON.parse(fs.readFileSync(path.join(repoRoot, 'fixtures', 'servicedesk', 'tickets', 'vague-vpn.json'), 'utf8')));
t = classifyTicket(t, { fixtureId: 'vague-vpn' });
t = triageTicket(t);
t = await analyzeKb(t, { skipHttp: true });
return [{ json: t }];`,
  ],
  [
    'workflows/servicedesk/sd-bot-reply.json',
    'SD Bot Reply',
    `${header}const { createServiceDeskTicket, classifyTicket, triageTicket, processTicketCycle, FileServiceDeskStore } = lib;
let t = createServiceDeskTicket({ summary: 'VPN broken', description: 'cannot connect' });
t = classifyTicket(t, { fixtureId: 'vague-vpn' });
t = triageTicket(t);
const store = new FileServiceDeskStore(path.join(dataRoot, '_runtime', 'sd-bot-demo.json'));
store.upsertTicket(t);
const out = path.join(dataRoot, 'outbound', 'servicedesk', 'chat');
return [{ json: await processTicketCycle(t, store, { skipHttp: true, outDir: out }) }];`,
  ],
  [
    'workflows/servicedesk/sd-await-user.json',
    'SD Await User',
    `${header}const { normalizeTicketPayload, processTicketCycle, FileServiceDeskStore } = lib;
const inDir = path.join(dataRoot, 'inbound', 'servicedesk', 'chat');
const store = new FileServiceDeskStore(path.join(dataRoot, '_runtime', 'sd-await-demo.json'));
let t = normalizeTicketPayload(JSON.parse(fs.readFileSync(path.join(repoRoot, 'fixtures', 'servicedesk', 'tickets', 'awaiting-user.json'), 'utf8')));
store.upsertTicket(t);
fs.mkdirSync(inDir, { recursive: true });
fs.writeFileSync(path.join(inDir, t.id + '-user-reply.json'), JSON.stringify({ text: 'Outlook 365, still failing' }));
return [{ json: await processTicketCycle(t, store, { skipHttp: true, inDir }) }];`,
  ],
  [
    'workflows/servicedesk/sd-handoff-technician.json',
    'SD Handoff Technician',
    `${header}const { createServiceDeskTicket, classifyTicket, triageTicket, handoffToTechnician } = lib;
let t = createServiceDeskTicket({ summary: 'VPN broken', description: 'error 809' });
t = classifyTicket(t, { fixtureId: 'vague-vpn' });
t = triageTicket(t);
return [{ json: handoffToTechnician(t, 'elicitation_complete') }];`,
  ],
  [
    'workflows/servicedesk/sd-existing-ticket-refresh.json',
    'SD Existing Ticket Refresh',
    `${header}const { normalizeTicketPayload, classifyTicket, triageTicket, analyzeKb } = lib;
let t = normalizeTicketPayload(JSON.parse(fs.readFileSync(path.join(repoRoot, 'fixtures', 'servicedesk', 'tickets', 'awaiting-user.json'), 'utf8')));
t = classifyTicket(t);
t = triageTicket(t);
t = await analyzeKb(t, { skipHttp: true });
return [{ json: t }];`,
  ],
  [
    'workflows/daily-checks/dc-schedule-run.json',
    'DC Schedule Run',
    `${header}const { runCheckQuery } = lib;
return [{ json: runCheckQuery('stale-pipeline') }];`,
  ],
  [
    'workflows/daily-checks/dc-triage-exception.json',
    'DC Triage Exception',
    `${header}const { runCheckQuery, triageException, createExceptionTicket } = lib;
const row = runCheckQuery('stale-pipeline').rows[0];
const { triage, summary } = triageException(row);
const ticket = await createExceptionTicket(row, triage, { skipHttp: true });
return [{ json: { row, triage, summary, ticket } }];`,
  ],
  [
    'workflows/daily-checks/dc-cursor-bundle.json',
    'DC Cursor Bundle',
    `${header}const { runCheckQuery, triageException, writeCursorBundle, newCheckRunId } = lib;
const row = runCheckQuery('null-required-fields').rows[0];
const { triage, summary } = triageException(row);
const dir = writeCursorBundle({ checkRunId: newCheckRunId(), row, triage, summary, outRoot: path.join(dataRoot, 'cursor-requests') });
return [{ json: { bundle_dir: dir } }];`,
  ],
  [
    'workflows/daily-ops/do-schedule-run.json',
    'DO Schedule Run',
    `${header}const { runOpsQuery } = lib;
return [{ json: runOpsQuery('open-incidents') }];`,
  ],
  [
    'workflows/daily-ops/do-route-owners.json',
    'DO Route Owners',
    `${header}const { runOpsQuery, triageOpsTask, writeTeamsNotification } = lib;
const row = runOpsQuery('pending-changes').rows[0];
const { route } = triageOpsTask(row, []);
const file = writeTeamsNotification(row, route, path.join(dataRoot, 'outbound', 'teams'));
return [{ json: { row, route, file } }];`,
  ],
];

for (const entry of defs) {
  const [file, name, code, pos, codeNodeName] = entry;
  const full = path.join(repoRoot, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(wf(name, code, pos ?? [260, 0], codeNodeName), null, 2));
}

console.log(`Wrote ${defs.length} workflows`);
