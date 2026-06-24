# Service desk program overview

#n8n #servicedesk #program

**Status:** POC implemented

## Intent

Simulate an **L1 service desk bot technician** (`bot-l1-sandbox`) that:

1. **Polls unified ticket API** (`GET /tickets?assignee=bot-l1-sandbox`) for new and existing work
2. Classifies and triages tickets (priority order)
3. Analyzes against fixture KB + `GET /kb/search`
4. Chats with requester via file sim (`inbound/servicedesk/chat/` → `outbound/servicedesk/chat/`)
5. Hands off to human technician queue when elicitation completes or user requests a person

## Entry point

**`sd-queue-poller`** — single schedule-driven poller; discovers tickets from mock API (or fixtures offline).

## Workflows

| Workflow | Doc |
|----------|-----|
| `sd-queue-poller` | [[workflows/servicedesk/sd-queue-poller]] |
| `sd-intake` | [[workflows/servicedesk/sd-intake]] |
| `sd-classify-triage` | [[workflows/servicedesk/sd-classify-triage]] |
| `sd-bot-reply` | [[workflows/servicedesk/sd-bot-reply]] |
| `sd-await-user` | [[workflows/servicedesk/sd-await-user]] |
| `sd-handoff-technician` | [[workflows/servicedesk/sd-handoff-technician]] |
| `sd-existing-ticket-refresh` | [[workflows/servicedesk/sd-existing-ticket-refresh]] |

Full index: [[workflows/00-workflows-index]]. n8n testing: [[guides/workflow-testing]].

## Lib

`lib/servicedesk/*` — see [[lib/public-api]]

## Smoke

```powershell
.\scripts\run.ps1 smoke-servicedesk
```

## Related

- [[programs/servicedesk/conversation-model]]
- [[schemas/servicedesk-ticket]]
- [[architecture/decisions/008-servicedesk-conversation-handoff]]
