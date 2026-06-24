# Module map

#n8n #architecture #lib

## Core

| Module | Exports | Consumed by |
|--------|---------|-------------|
| `lib/core/paths.js` | `REPO_ROOT`, `DATA_ROOT`, channel dirs, `DEFAULT_BOT_TECH_ID` | all programs |
| `lib/core/db.js` | `FileComplaintStore` | complaints |
| `lib/core/http.js` | `postJson`, `getJson`, `patchJson`, `mockApiBaseUrl` | simulators, all routes |
| `lib/core/sandbox.js` | write/HTTP guards | all side effects |
| `lib/simulators/*` | ai, crm, ticketing, kb, email | all programs |

## Complaints (`lib/complaints/`)

| Module | Role |
|--------|------|
| `normalize.js` | artifact → ComplaintRecord |
| `classify.js` | sim AI |
| `route.js` | mock CRM + unified `/tickets` |
| `notify.js` | outbound email file |
| `monitor.js` | reply linking |
| `pipeline.js` | E2E + smoke |

## Service desk (`lib/servicedesk/`)

| Module | Role |
|--------|------|
| `queue.js` | poll unified ticket API / fixtures |
| `intake.js` | normalize ticket payload |
| `classify.js` / `triage.js` / `kb.js` | bot triage pipeline |
| `conversation.js` / `elicitation.js` / `handoff.js` | chat loop + exit |
| `store.js` | `FileServiceDeskStore` |
| `pipeline.js` | E2E + smoke |

## Daily checks / daily ops

| Module | Role |
|--------|------|
| `lib/daily-checks/*` | query fixtures, triage, cursor bundles |
| `lib/daily-ops/*` | query fixtures, owner routing, Teams sim |

Contract: [[lib/public-api]] · runtime: [[guides/native-runtime]]
