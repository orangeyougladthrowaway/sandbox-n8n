# Integrations catalog

#n8n #integrations #sandbox

| Production capability | Sandbox substitute | How to run |
|----------------------|-------------------|------------|
| Exchange / IMAP mailbox | `DATA_ROOT/inbound/mailbox/` `.eml` drops | file drop |
| Service desk chat | `inbound/servicedesk/chat/` + `outbound/servicedesk/chat/` | file JSON drops |
| Scanned docs | `DATA_ROOT/inbound/scans/` | file drop |
| Call transcripts | `DATA_ROOT/inbound/transcripts/*.json` | fixtures |
| **Unified ticketing** | `GET/POST/PATCH localhost:3099/tickets` | `run.ps1 mock-api` |
| AI classify / sentiment | `lib/simulators/aiClient.js` + `POST /ai/analyze` | mock-api |
| Service desk AI | `POST /ai/servicedesk` | mock-api |
| CRM API | `POST http://localhost:3099/crm/complaints` | mock-api |
| KB / Confluence | `fixtures/servicedesk/kb/*.md` + `GET /kb/search?q=` | mock-api or lib |
| Outbound email | `DATA_ROOT/outbound/sent/` | lib write |
| Inbound replies | `DATA_ROOT/inbound/mailbox/replies/` | Thread-ID link |
| Reporting DB | `DATA_ROOT/_runtime/*.json` (POC) | File*Store |
| Teams notification | `DATA_ROOT/outbound/teams/` JSON drops | daily-ops lib |
| Cursor investigation | `DATA_ROOT/cursor-requests/` bundles | daily-checks lib |

## Unified ticket API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/tickets?assignee=&status=&source_program=&sort=priority` | Poll queue (service desk entry point) |
| POST | `/tickets` | Create ticket (all programs) |
| GET | `/tickets/:id` | Fetch ticket |
| PATCH | `/tickets/:id` | Update status, assignee, metadata |
| POST | `/tickets/:id/comments` | Append comment |

All tickets include `source_program`: `complaints` | `servicedesk` | `daily-checks` | `daily-ops`.

Start mock API: `.\scripts\run.ps1 mock-api`
