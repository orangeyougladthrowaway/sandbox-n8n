import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const vaultWorkflows = path.join(repoRoot, 'docs', 'vault', 'workflows');

/**
 * @typedef {object} WorkflowDoc
 * @property {string} id
 * @property {string} name
 * @property {string} program
 * @property {string} jsonPath
 * @property {string} purpose
 * @property {string} libCalls
 * @property {string} mermaid
 * @property {string} success
 * @property {string} [cli]
 */

/** @type {WorkflowDoc[]} */
const workflows = [
  {
    id: 'create-ticket',
    name: 'Shared Create Ticket',
    program: '_shared',
    jsonPath: 'workflows/_shared/create-ticket.json',
    purpose: 'Validate and POST a unified ticket payload to mock API (or simulate offline).',
    libCalls: '`createTicketPayload`, `validateTicketPayload`, `createTicket`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> C[Code: build payload]
  C --> V[validateTicketPayload]
  V --> API[POST /tickets or sim]`,
    success: 'Output JSON has `ticket_ref` (real from mock-api or `tkt_sim_shared` offline).',
    cli: 'Requires mock-api for real HTTP: `run.ps1 mock-api` then set `N8N_MOCK_API_ENABLED=1` in n8n env.',
  },
  {
    id: 'kb-search',
    name: 'Shared KB Search',
    program: '_shared',
    jsonPath: 'workflows/_shared/kb-search.json',
    purpose: 'Search fixture KB articles for a query term.',
    libCalls: '`searchKbFixtures`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> C[Code: searchKbFixtures vpn]
  C --> R[items array]`,
    success: 'Output `items` includes VPN troubleshooting doc with score > 0.',
  },
  {
    id: 'call-ai-sim',
    name: 'Shared Call AI Sim',
    program: '_shared',
    jsonPath: 'workflows/_shared/call-ai-sim.json',
    purpose: 'Run deterministic AI classifier on sample text.',
    libCalls: '`analyzeText`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> C[Code: analyzeText]
  C --> R[classification + sentiment]`,
    success: 'Output `classification.category` is `dsar` for subject-access sample text.',
  },
  {
    id: 'send-notification',
    name: 'Shared Send Notification',
    program: '_shared',
    jsonPath: 'workflows/_shared/send-notification.json',
    purpose: 'Write a notification sim file under outbound/sent/.',
    libCalls: 'fs write under `DATA_ROOT/outbound/sent/`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> C[Code: write file]
  C --> F[outbound/sent/shared-notify.txt]`,
    success: 'File exists at path in output JSON; stays under `N8N_DATA_ROOT`.',
  },
  {
    id: 'log-lifecycle-event',
    name: 'Shared Log Lifecycle Event',
    program: '_shared',
    jsonPath: 'workflows/_shared/log-lifecycle-event.json',
    purpose: 'Emit a structured log event via lib logging helper.',
    libCalls: '`logEvent`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> C[Code: logEvent]
  C --> J[log entry JSON]`,
    success: 'Output JSON contains event metadata with `ok: true` in detail.',
  },
  {
    id: 'complaints-intake',
    name: 'Complaints Intake',
    program: 'complaints',
    jsonPath: 'workflows/complaints/complaints-intake.json',
    purpose: 'Full complaints pipeline: copy angry-support fixture → normalize → classify → route → notify.',
    libCalls: '`processComplaintFile`, `FileComplaintStore`',
    mermaid: `flowchart TD
  T[Manual Trigger] --> C[Copy fixture to inbound/mailbox]
  C --> P[processComplaintFile]
  P --> N[normalize]
  N --> CL[classify]
  CL --> R[route + notify]
  R --> OUT[ComplaintRecord JSON]`,
    success: '`classification.category` present; `ticket_ref` set; `_runtime/complaints-db.json` updated; email sim in `outbound/sent/`.',
    cli: '`.\\scripts\\run.ps1 smoke-complaints` or `process-complaints`',
  },
  {
    id: 'complaints-classify',
    name: 'Complaints Classify',
    program: 'complaints',
    jsonPath: 'workflows/complaints/complaints-classify.json',
    purpose: 'Normalize and classify formal-dsar fixture only.',
    libCalls: '`normalizeInboundArtifact`, `classifyComplaint`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> N[normalize formal-dsar.eml]
  N --> CL[classifyComplaint]
  CL --> R[category dsar]`,
    success: 'Output `classification.category` is `dsar`; `requested_actions` includes `DSAR`.',
  },
  {
    id: 'complaints-route',
    name: 'Complaints Route',
    program: 'complaints',
    jsonPath: 'workflows/complaints/complaints-route.json',
    purpose: 'Route a compliance complaint to CRM sim + unified ticket (offline by default).',
    libCalls: '`routeComplaint` with `skipHttp: true`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> R[routeComplaint]
  R --> CRM[crm_sim ref]
  R --> TKT[tkt_sim ref]`,
    success: 'Output has `ticket_ref` and lifecycle event `ticket_created`; `source_program` would be complaints on real API post.',
  },
  {
    id: 'complaints-notify-customer',
    name: 'Complaints Notify Customer',
    program: 'complaints',
    jsonPath: 'workflows/complaints/complaints-notify-customer.json',
    purpose: 'Render and write customer notification email sim.',
    libCalls: '`notifyCustomer`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> N[notifyCustomer]
  N --> F[outbound/sent/]`,
    success: 'New file under `outbound/sent/`; record status reflects notification.',
  },
  {
    id: 'complaints-monitor-replies',
    name: 'Complaints Monitor Replies',
    program: 'complaints',
    jsonPath: 'workflows/complaints/complaints-monitor-replies.json',
    purpose: 'Link inbound reply .eml to complaint by Thread-ID.',
    libCalls: '`processReplyFile`, `FileComplaintStore`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> S[seed complaint in store]
  S --> W[write reply .eml]
  W --> M[processReplyFile]
  M --> U[updated record]`,
    success: 'Output record updated; reply linked via `thread_id`; may escalate status.',
  },
  {
    id: 'sd-queue-poller',
    name: 'SD Queue Poller',
    program: 'servicedesk',
    jsonPath: 'workflows/servicedesk/sd-queue-poller.json',
    purpose: 'Entry point: poll fixture queue (or API), pick priority ticket, run one bot cycle.',
    libCalls: '`runQueuePoller`, `FileServiceDeskStore`',
    mermaid: `flowchart TD
  T[Manual Trigger] --> Q[pollBotQueue / fixtures]
  Q --> P[pickNextTicket]
  P --> C[processTicketCycle]
  C --> OUT[ticket JSON or no tickets]`,
    success: 'Returns ticket with `status` awaiting_user or with_technician; `_runtime/servicedesk-db.json` updated; bot chat file in `outbound/servicedesk/chat/` when applicable.',
    cli: '`.\\scripts\\run.ps1 process-servicedesk`',
  },
  {
    id: 'sd-intake',
    name: 'SD Intake',
    program: 'servicedesk',
    jsonPath: 'workflows/servicedesk/sd-intake.json',
    purpose: 'Normalize vague-vpn fixture into ServiceDeskTicket schema.',
    libCalls: '`normalizeTicketPayload`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> L[load fixture JSON]
  L --> N[normalizeTicketPayload]
  N --> V[validated ticket]`,
    success: 'Output has `id`, `summary`, `requester`, lifecycle event `received`.',
  },
  {
    id: 'sd-classify-triage',
    name: 'SD Classify Triage',
    program: 'servicedesk',
    jsonPath: 'workflows/servicedesk/sd-classify-triage.json',
    purpose: 'Classify, triage, and KB-analyze a VPN ticket.',
    libCalls: '`classifyTicket`, `triageTicket`, `analyzeKb`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> CL[classifyTicket]
  CL --> TR[triageTicket]
  TR --> KB[analyzeKb]
  KB --> R[kb_matches + triage]`,
    success: '`status` is `in_bot_triage`; `triage.queue` set; `kb_matches` non-empty for VPN fixture.',
  },
  {
    id: 'sd-bot-reply',
    name: 'SD Bot Reply',
    program: 'servicedesk',
    jsonPath: 'workflows/servicedesk/sd-bot-reply.json',
    purpose: 'Run one bot elicitation cycle and write chat outbound file.',
    libCalls: '`processTicketCycle`',
    mermaid: `flowchart TD
  T[Manual Trigger] --> CL[classify + triage]
  CL --> P[processTicketCycle]
  P --> B[bot conversation turn]
  B --> F[outbound/servicedesk/chat/]`,
    success: '`status` is `awaiting_user`; conversation includes bot turn; JSON chat file created.',
  },
  {
    id: 'sd-await-user',
    name: 'SD Await User',
    program: 'servicedesk',
    jsonPath: 'workflows/servicedesk/sd-await-user.json',
    purpose: 'Process inbound user chat reply for awaiting_user ticket.',
    libCalls: '`processTicketCycle` with inbound chat file',
    mermaid: `flowchart LR
  T[Manual Trigger] --> IN[drop user reply JSON]
  IN --> P[processTicketCycle]
  P --> OUT[handoff or next bot turn]`,
    success: 'User turn appended to `conversation`; may handoff if user requests human.',
  },
  {
    id: 'sd-handoff-technician',
    name: 'SD Handoff Technician',
    program: 'servicedesk',
    jsonPath: 'workflows/servicedesk/sd-handoff-technician.json',
    purpose: 'Hand off ticket to human technician queue with summary.',
    libCalls: '`handoffToTechnician`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> CL[classify + triage]
  CL --> H[handoffToTechnician]
  H --> R[status with_technician]`,
    success: '`status` is `with_technician`; `assignment.handoff_at` set; handoff lifecycle events present.',
  },
  {
    id: 'sd-existing-ticket-refresh',
    name: 'SD Existing Ticket Refresh',
    program: 'servicedesk',
    jsonPath: 'workflows/servicedesk/sd-existing-ticket-refresh.json',
    purpose: 'Re-run classify, triage, KB on existing awaiting_user ticket.',
    libCalls: '`classifyTicket`, `triageTicket`, `analyzeKb`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> L[awaiting-user fixture]
  L --> R[refresh classify/triage/KB]
  R --> OUT[updated ticket]`,
    success: 'KB matches refreshed; triage block populated; lifecycle includes kb_analyzed.',
  },
  {
    id: 'dc-schedule-run',
    name: 'DC Schedule Run',
    program: 'daily-checks',
    jsonPath: 'workflows/daily-checks/dc-schedule-run.json',
    purpose: 'Run stale-pipeline check query (fixture rows).',
    libCalls: '`runCheckQuery`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> Q[runCheckQuery stale-pipeline]
  Q --> R[rows with exc_001]`,
    success: 'Output `rows` has one row with id `exc_001`.',
    cli: '`.\\scripts\\run.ps1 smoke-daily-checks`',
  },
  {
    id: 'dc-triage-exception',
    name: 'DC Triage Exception',
    program: 'daily-checks',
    jsonPath: 'workflows/daily-checks/dc-triage-exception.json',
    purpose: 'Triage exception row and create unified ticket (sim offline).',
    libCalls: '`triageException`, `createExceptionTicket`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> Q[runCheckQuery]
  Q --> TR[triageException]
  TR --> TK[createExceptionTicket]`,
    success: 'Output includes `triage.owner_team`, `summary`, and `ticket.ticket_ref`.',
  },
  {
    id: 'dc-cursor-bundle',
    name: 'DC Cursor Bundle',
    program: 'daily-checks',
    jsonPath: 'workflows/daily-checks/dc-cursor-bundle.json',
    purpose: 'Write Cursor investigation bundle under cursor-requests/.',
    libCalls: '`writeCursorBundle`, `newCheckRunId`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> TR[triageException]
  TR --> B[writeCursorBundle]
  B --> D[cursor-requests/check_run/...]`,
    success: 'Output `bundle_dir` exists with `context.json`, `prompt.md`, `pr-summary.md`.',
  },
  {
    id: 'do-schedule-run',
    name: 'DO Schedule Run',
    program: 'daily-ops',
    jsonPath: 'workflows/daily-ops/do-schedule-run.json',
    purpose: 'Run open-incidents ops query (fixture rows).',
    libCalls: '`runOpsQuery`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> Q[runOpsQuery open-incidents]
  Q --> R[ops rows]`,
    success: 'Output `rows` includes `ops_001` VPN gateway incident.',
    cli: '`.\\scripts\\run.ps1 smoke-daily-ops`',
  },
  {
    id: 'do-route-owners',
    name: 'DO Route Owners',
    program: 'daily-ops',
    jsonPath: 'workflows/daily-ops/do-route-owners.json',
    purpose: 'Route ops task to owner team and write Teams notification JSON.',
    libCalls: '`triageOpsTask`, `writeTeamsNotification`',
    mermaid: `flowchart LR
  T[Manual Trigger] --> Q[runOpsQuery]
  Q --> TR[triageOpsTask]
  TR --> TEAMS[writeTeamsNotification]
  TEAMS --> F[outbound/teams/]`,
    success: 'Output `file` path exists; JSON contains `team` and `title`.',
  },
];

function renderDoc(w) {
  const cliBlock = w.cli ? `\n## CLI equivalent\n\n\`${w.cli}\`\n` : '';
  return `# ${w.name}

#n8n #workflow #${w.program.replace('_shared', 'shared')}

## File

\`${w.jsonPath}\`

## Purpose

${w.purpose}

## Trigger

Manual Trigger (POC). Production would use Schedule / file watch / webhook per program.

## Flow

\`\`\`mermaid
${w.mermaid}
\`\`\`

## Lib calls

${w.libCalls}

## Success criteria

${w.success}

All writes stay under \`N8N_DATA_ROOT\`. See [[governance/sandbox-boundaries]].
${cliBlock}
## Related

- [[workflows/00-workflows-index]]
- [[workflows/data-flow]]
`;
}

for (const w of workflows) {
  const dir = path.join(vaultWorkflows, w.program);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${w.id}.md`), renderDoc(w), 'utf8');
}

const indexRows = workflows
  .map(
    (w) =>
      `| ${w.name} | [[workflows/${w.program}/${w.id}]] | \`${w.jsonPath}\` |`,
  )
  .join('\n');

const index = `# Workflows index

#n8n #workflow #MOC

All workflow JSON lives under \`workflows/\`. Each workflow is a **thin Manual Trigger + Code node** that calls \`lib/\`. Logic is tested by \`npm test\` without n8n.

## Architecture

- [[workflows/data-flow]] — program-level flows
- [[guides/native-runtime]] — env vars and processes
- [[testing/strategy]] — automated tests

## Import into n8n

\`\`\`powershell
.\\scripts\\run.ps1 import-workflows
\`\`\`

Set \`N8N_REPO_ROOT\` and \`N8N_DATA_ROOT\` before executing ( \`run.ps1 n8n\` does this automatically).

## _shared

| Workflow | Doc | JSON |
|----------|-----|------|
${workflows.filter((w) => w.program === '_shared').map((w) => `| ${w.name} | [[workflows/_shared/${w.id}]] | \`${w.jsonPath}\` |`).join('\n')}

## Complaints

| Workflow | Doc | JSON |
|----------|-----|------|
${workflows.filter((w) => w.program === 'complaints').map((w) => `| ${w.name} | [[workflows/complaints/${w.id}]] | \`${w.jsonPath}\` |`).join('\n')}

## Service desk

| Workflow | Doc | JSON |
|----------|-----|------|
${workflows.filter((w) => w.program === 'servicedesk').map((w) => `| ${w.name} | [[workflows/servicedesk/${w.id}]] | \`${w.jsonPath}\` |`).join('\n')}

## Daily checks

| Workflow | Doc | JSON |
|----------|-----|------|
${workflows.filter((w) => w.program === 'daily-checks').map((w) => `| ${w.name} | [[workflows/daily-checks/${w.id}]] | \`${w.jsonPath}\` |`).join('\n')}

## Daily ops

| Workflow | Doc | JSON |
|----------|-----|------|
${workflows.filter((w) => w.program === 'daily-ops').map((w) => `| ${w.name} | [[workflows/daily-ops/${w.id}]] | \`${w.jsonPath}\` |`).join('\n')}

## Recommended demo order

1. [[workflows/complaints/complaints-intake]]
2. [[workflows/servicedesk/sd-queue-poller]] → [[workflows/servicedesk/sd-bot-reply]] → [[workflows/servicedesk/sd-await-user]]
3. [[workflows/daily-checks/dc-cursor-bundle]]
4. [[workflows/daily-ops/do-route-owners]]
`;

fs.writeFileSync(path.join(vaultWorkflows, '00-workflows-index.md'), index, 'utf8');
console.log(`Wrote ${workflows.length} workflow docs + index`);
