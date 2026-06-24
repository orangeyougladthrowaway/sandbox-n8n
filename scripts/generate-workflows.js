import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function wf(name, tag, code, pos = [260, 0]) {
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
        name: 'Run lib',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: pos,
      },
    ],
    connections: {
      'Manual Trigger': { main: [[{ node: 'Run lib', type: 'main', index: 0 }]] },
    },
    active: false,
    settings: { executionOrder: 'v1' },
    versionId: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    meta: { instanceId: 'sandbox-n8n' },
    tags: [tag],
  };
}

const header = `const path = await import('node:path');
const { pathToFileURL } = await import('node:url');
const repoRoot = process.env.N8N_REPO_ROOT ?? 'C:/repos/sandbox-n8n';
const dataRoot = process.env.N8N_DATA_ROOT ?? 'C:/sandbox-dir/sandbox-n8n';
const lib = await import(pathToFileURL(path.join(repoRoot, 'lib', 'index.js')).href);
`;

const defs = [
  [
    'workflows/_shared/create-ticket.json',
    'Shared Create Ticket',
    'shared',
    `${header}const { createTicketPayload, validateTicketPayload, createTicket } = lib;
const payload = createTicketPayload({ title: 'Shared test', description: 'POC', priority: 'medium', source_ref: 'shared_1', source_program: 'servicedesk' });
const v = validateTicketPayload(payload);
if (!v.valid) throw new Error(v.errors.join('; '));
try { const t = await createTicket(v.payload); return [{ json: t }]; } catch { return [{ json: { ticket_ref: 'tkt_sim_shared', simulated: true } }]; }`,
  ],
  [
    'workflows/_shared/kb-search.json',
    'Shared KB Search',
    'shared',
    `${header}const { searchKbFixtures } = lib;
return [{ json: { items: searchKbFixtures('vpn') } }];`,
  ],
  [
    'workflows/_shared/call-ai-sim.json',
    'Shared Call AI Sim',
    'shared',
    `${header}const { analyzeText } = lib;
return [{ json: analyzeText('subject access request') }];`,
  ],
  [
    'workflows/_shared/send-notification.json',
    'Shared Send Notification',
    'shared',
    `${header}const fs = await import('node:fs');
const out = path.join(dataRoot, 'outbound', 'sent', 'shared-notify.txt');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, 'notification sim');
return [{ json: { path: out } }];`,
  ],
  [
    'workflows/_shared/log-lifecycle-event.json',
    'Shared Log Lifecycle Event',
    'shared',
    `${header}const { logEvent } = lib;
return [{ json: logEvent('workflow', 'shared_event', { ok: true }) }];`,
  ],
  [
    'workflows/complaints/complaints-classify.json',
    'Complaints Classify',
    'complaints',
    `${header}const fs = await import('node:fs');
const { normalizeInboundArtifact, classifyComplaint } = lib;
const fp = path.join(repoRoot, 'fixtures', 'complaints', 'formal-dsar.eml');
const record = classifyComplaint(normalizeInboundArtifact(fp, fs.readFileSync(fp, 'utf8')));
return [{ json: record }];`,
  ],
  [
    'workflows/complaints/complaints-route.json',
    'Complaints Route',
    'complaints',
    `${header}const { createComplaintRecord, routeComplaint } = lib;
let r = createComplaintRecord({ id: 'cmp_route_demo', normalized_text: 'FCA compliance issue', classification: { category: 'compliance', confidence: 0.9, rationale: 'demo' }, requested_actions: ['COMPLIANCE'] });
r = await routeComplaint(r, { skipHttp: true });
return [{ json: r }];`,
  ],
  [
    'workflows/complaints/complaints-notify-customer.json',
    'Complaints Notify Customer',
    'complaints',
    `${header}const { createComplaintRecord, notifyCustomer } = lib;
const r = createComplaintRecord({ id: 'cmp_notify', normalized_text: 'test', thread_id: 'thread-demo' });
return [{ json: notifyCustomer(r, { outDir: path.join(dataRoot, 'outbound', 'sent') }).record }];`,
  ],
  [
    'workflows/complaints/complaints-monitor-replies.json',
    'Complaints Monitor Replies',
    'complaints',
    `${header}const fs = await import('node:fs');
const { FileComplaintStore, processReplyFile, createComplaintRecord } = lib;
const db = path.join(dataRoot, '_runtime', 'complaints-reply-demo.json');
const store = new FileComplaintStore(db);
store.upsertComplaint(createComplaintRecord({ id: 'cmp_reply', thread_id: 'thread-reply-demo' }));
const reply = path.join(dataRoot, 'inbound', 'mailbox', 'replies', 'demo-reply.eml');
fs.mkdirSync(path.dirname(reply), { recursive: true });
fs.writeFileSync(reply, 'Thread-ID: thread-reply-demo\\n\\nStill unhappy');
return [{ json: processReplyFile(reply, store) }];`,
  ],
  [
    'workflows/servicedesk/sd-queue-poller.json',
    'SD Queue Poller',
    'servicedesk',
    `${header}const { FileServiceDeskStore, runQueuePoller } = lib;
const store = new FileServiceDeskStore(path.join(dataRoot, '_runtime', 'servicedesk-db.json'));
const result = await runQueuePoller(store, { skipHttp: true });
return [{ json: result ?? { message: 'no tickets' } }];`,
  ],
  [
    'workflows/servicedesk/sd-intake.json',
    'SD Intake',
    'servicedesk',
    `${header}const fs = await import('node:fs');
const { normalizeTicketPayload } = lib;
const raw = JSON.parse(fs.readFileSync(path.join(repoRoot, 'fixtures', 'servicedesk', 'tickets', 'vague-vpn.json'), 'utf8'));
return [{ json: normalizeTicketPayload(raw) }];`,
  ],
  [
    'workflows/servicedesk/sd-classify-triage.json',
    'SD Classify Triage',
    'servicedesk',
    `${header}const fs = await import('node:fs');
const { normalizeTicketPayload, classifyTicket, triageTicket, analyzeKb } = lib;
let t = normalizeTicketPayload(JSON.parse(fs.readFileSync(path.join(repoRoot, 'fixtures', 'servicedesk', 'tickets', 'vague-vpn.json'), 'utf8')));
t = classifyTicket(t, { fixtureId: 'vague-vpn' });
t = triageTicket(t);
t = await analyzeKb(t, { skipHttp: true });
return [{ json: t }];`,
  ],
  [
    'workflows/servicedesk/sd-bot-reply.json',
    'SD Bot Reply',
    'servicedesk',
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
    'servicedesk',
    `${header}const fs = await import('node:fs');
const { normalizeTicketPayload, processTicketCycle, FileServiceDeskStore } = lib;
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
    'servicedesk',
    `${header}const { createServiceDeskTicket, classifyTicket, triageTicket, handoffToTechnician } = lib;
let t = createServiceDeskTicket({ summary: 'VPN broken', description: 'error 809' });
t = classifyTicket(t, { fixtureId: 'vague-vpn' });
t = triageTicket(t);
return [{ json: handoffToTechnician(t, 'elicitation_complete') }];`,
  ],
  [
    'workflows/servicedesk/sd-existing-ticket-refresh.json',
    'SD Existing Ticket Refresh',
    'servicedesk',
    `${header}const fs = await import('node:fs');
const { normalizeTicketPayload, classifyTicket, triageTicket, analyzeKb } = lib;
let t = normalizeTicketPayload(JSON.parse(fs.readFileSync(path.join(repoRoot, 'fixtures', 'servicedesk', 'tickets', 'awaiting-user.json'), 'utf8')));
t = classifyTicket(t);
t = triageTicket(t);
t = await analyzeKb(t, { skipHttp: true });
return [{ json: t }];`,
  ],
  [
    'workflows/daily-checks/dc-schedule-run.json',
    'DC Schedule Run',
    'daily-checks',
    `${header}const { runCheckQuery } = lib;
return [{ json: runCheckQuery('stale-pipeline') }];`,
  ],
  [
    'workflows/daily-checks/dc-triage-exception.json',
    'DC Triage Exception',
    'daily-checks',
    `${header}const { runCheckQuery, triageException, createExceptionTicket } = lib;
const row = runCheckQuery('stale-pipeline').rows[0];
const { triage, summary } = triageException(row);
const ticket = await createExceptionTicket(row, triage, { skipHttp: true });
return [{ json: { row, triage, summary, ticket } }];`,
  ],
  [
    'workflows/daily-checks/dc-cursor-bundle.json',
    'DC Cursor Bundle',
    'daily-checks',
    `${header}const { runCheckQuery, triageException, writeCursorBundle, newCheckRunId } = lib;
const row = runCheckQuery('null-required-fields').rows[0];
const { triage, summary } = triageException(row);
const dir = writeCursorBundle({ checkRunId: newCheckRunId(), row, triage, summary, outRoot: path.join(dataRoot, 'cursor-requests') });
return [{ json: { bundle_dir: dir } }];`,
  ],
  [
    'workflows/daily-ops/do-schedule-run.json',
    'DO Schedule Run',
    'daily-ops',
    `${header}const { runOpsQuery } = lib;
return [{ json: runOpsQuery('open-incidents') }];`,
  ],
  [
    'workflows/daily-ops/do-route-owners.json',
    'DO Route Owners',
    'daily-ops',
    `${header}const { runOpsQuery, triageOpsTask, writeTeamsNotification } = lib;
const row = runOpsQuery('pending-changes').rows[0];
const { route } = triageOpsTask(row, []);
const file = writeTeamsNotification(row, route, path.join(dataRoot, 'outbound', 'teams'));
return [{ json: { row, route, file } }];`,
  ],
];

for (const [file, name, tag, code] of defs) {
  const full = path.join(repoRoot, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(wf(name, tag, code), null, 2));
}

console.log(`Wrote ${defs.length} workflows`);
