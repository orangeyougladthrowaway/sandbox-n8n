# Workflows index

#n8n #workflow #MOC

All workflow JSON lives under `workflows/`. Each workflow is a **thin Manual Trigger + Code node** that calls `lib/`. Logic is tested by `npm test` without n8n.

## Architecture

- [[workflows/data-flow]] — program-level flows
- [[guides/native-runtime]] — env vars and processes
- [[testing/strategy]] — automated tests

## Import into n8n

```powershell
.\scripts\run.ps1 import-workflows
```

Set `N8N_REPO_ROOT` and `N8N_DATA_ROOT` before executing ( `run.ps1 n8n` does this automatically).

## _shared

| Workflow | Doc | JSON |
|----------|-----|------|
| Shared Create Ticket | [[workflows/_shared/create-ticket]] | `workflows/_shared/create-ticket.json` |
| Shared KB Search | [[workflows/_shared/kb-search]] | `workflows/_shared/kb-search.json` |
| Shared Call AI Sim | [[workflows/_shared/call-ai-sim]] | `workflows/_shared/call-ai-sim.json` |
| Shared Send Notification | [[workflows/_shared/send-notification]] | `workflows/_shared/send-notification.json` |
| Shared Log Lifecycle Event | [[workflows/_shared/log-lifecycle-event]] | `workflows/_shared/log-lifecycle-event.json` |

## Complaints

| Workflow | Doc | JSON |
|----------|-----|------|
| Complaints Intake | [[workflows/complaints/complaints-intake]] | `workflows/complaints/complaints-intake.json` |
| Complaints Classify | [[workflows/complaints/complaints-classify]] | `workflows/complaints/complaints-classify.json` |
| Complaints Route | [[workflows/complaints/complaints-route]] | `workflows/complaints/complaints-route.json` |
| Complaints Notify Customer | [[workflows/complaints/complaints-notify-customer]] | `workflows/complaints/complaints-notify-customer.json` |
| Complaints Monitor Replies | [[workflows/complaints/complaints-monitor-replies]] | `workflows/complaints/complaints-monitor-replies.json` |

## Service desk

| Workflow | Doc | JSON |
|----------|-----|------|
| SD Queue Poller | [[workflows/servicedesk/sd-queue-poller]] | `workflows/servicedesk/sd-queue-poller.json` |
| SD Intake | [[workflows/servicedesk/sd-intake]] | `workflows/servicedesk/sd-intake.json` |
| SD Classify Triage | [[workflows/servicedesk/sd-classify-triage]] | `workflows/servicedesk/sd-classify-triage.json` |
| SD Bot Reply | [[workflows/servicedesk/sd-bot-reply]] | `workflows/servicedesk/sd-bot-reply.json` |
| SD Await User | [[workflows/servicedesk/sd-await-user]] | `workflows/servicedesk/sd-await-user.json` |
| SD Handoff Technician | [[workflows/servicedesk/sd-handoff-technician]] | `workflows/servicedesk/sd-handoff-technician.json` |
| SD Existing Ticket Refresh | [[workflows/servicedesk/sd-existing-ticket-refresh]] | `workflows/servicedesk/sd-existing-ticket-refresh.json` |

## Daily checks

| Workflow | Doc | JSON |
|----------|-----|------|
| DC Schedule Run | [[workflows/daily-checks/dc-schedule-run]] | `workflows/daily-checks/dc-schedule-run.json` |
| DC Triage Exception | [[workflows/daily-checks/dc-triage-exception]] | `workflows/daily-checks/dc-triage-exception.json` |
| DC Cursor Bundle | [[workflows/daily-checks/dc-cursor-bundle]] | `workflows/daily-checks/dc-cursor-bundle.json` |

## Daily ops

| Workflow | Doc | JSON |
|----------|-----|------|
| DO Schedule Run | [[workflows/daily-ops/do-schedule-run]] | `workflows/daily-ops/do-schedule-run.json` |
| DO Route Owners | [[workflows/daily-ops/do-route-owners]] | `workflows/daily-ops/do-route-owners.json` |

## Recommended demo order

1. [[workflows/complaints/complaints-intake]]
2. [[workflows/servicedesk/sd-queue-poller]] → [[workflows/servicedesk/sd-bot-reply]] → [[workflows/servicedesk/sd-await-user]]
3. [[workflows/daily-checks/dc-cursor-bundle]]
4. [[workflows/daily-ops/do-route-owners]]
