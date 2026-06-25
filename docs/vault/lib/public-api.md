# lib public API

#n8n #lib #api

Testable business logic for all programs. Tests in `tests/*.test.js`. Sandbox rules: [[governance/sandbox-boundaries]].

## lib/core/paths.js

| Export | Description |
|--------|-------------|
| `REPO_ROOT` | Git clone root |
| `DATA_ROOT` | External runtime root (`N8N_DATA_ROOT`) |
| `INBOUND_*`, `OUTBOUND_*` | Mailbox, service desk chat, teams paths |
| `INBOUND_SERVICEDESK_CHAT`, `OUTBOUND_SERVICEDESK_CHAT` | Service desk file chat |
| `CURSOR_REQUESTS` | Daily checks Cursor bundles |
| `DEFAULT_BOT_TECH_ID` | Bot persona (`bot-l1-sandbox`) |
| `FIXTURES_DIR`, `WORKFLOWS_DIR`, `DB_QUERIES_DIR` | Repo-relative paths |
| `libImportUrl()` | Legacy `file://` URL helper — Code nodes use `require()` + `lib.DATA_ROOT` (see [[N8N-CODING-PRINCIPLES#Code nodes]]) |

## lib/core/sandbox.js · http.js · db.js

See [[governance/sandbox-boundaries]]. `patchJson` added for ticket updates.

## lib/schemas/ticket.js (unified)

| Export | Description |
|--------|-------------|
| `createTicketPayload` | Build POST body for `/tickets` |
| `validateTicketPayload` | Fail-fast validation |
| `SOURCE_PROGRAMS` | complaints, servicedesk, daily-checks, daily-ops |

## lib/schemas/servicedesk-ticket.js

| Export | Description |
|--------|-------------|
| `createServiceDeskTicket` | Rich service desk model |
| `validateServiceDeskTicket` | Shape check |
| `appendLifecycleEvent` | Immutable append |

## lib/simulators/ticketing.js

| Export | Description |
|--------|-------------|
| `createTicket`, `listTickets`, `getTicket`, `updateTicket` | Unified API client |
| `pollTicketsForAssignee` | Queue poller helper |

## lib/simulators/kb.js

| Export | Description |
|--------|-------------|
| `searchKb` | HTTP or fixture fallback |
| `searchKbFixtures` | In-process KB search |

## lib/servicedesk/*

| Module | Key exports |
|--------|-------------|
| `intake.js` | `normalizeTicketPayload`, `linkExternalTicket` |
| `classify.js` | `classifyTicket` |
| `triage.js` | `triageTicket`, `prioritySortKey` |
| `kb.js` | `analyzeKb` |
| `conversation.js` | `evaluateConversation`, `appendConversationTurn` |
| `elicitation.js` | `generateElicitationMessage`, `userRequestedHandoff` |
| `handoff.js` | `handoffToTechnician`, `buildHandoffSummary` |
| `queue.js` | `pollBotQueue`, `loadFixtureQueue`, `pickNextTicket` |
| `store.js` | `FileServiceDeskStore` |
| `pipeline.js` | `processTicketCycle`, `runQueuePoller`, `runServiceDeskSmoke` |

## lib/daily-checks/*

| Module | Key exports |
|--------|-------------|
| `triage.js` | `runCheckQuery`, `triageException`, `createExceptionTicket` |
| `cursorBundle.js` | `writeCursorBundle`, `newCheckRunId` |
| `pipeline.js` | `runDailyChecksSmoke` |

## lib/daily-ops/*

| Module | Key exports |
|--------|-------------|
| `triage.js` | `runOpsQuery`, `triageOpsTask`, `writeTeamsNotification` |
| `pipeline.js` | `runDailyOpsSmoke` |

## lib/complaints/*

Unchanged — see [[programs/complaints/overview]].

## lib/index.js

Barrel re-export for n8n Code nodes: `import lib from file://.../lib/index.js`.
