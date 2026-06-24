# Complaints program overview

#n8n #complaints #program

POC scope: multi-channel intake (mailbox eml, scan, transcript) → normalize → classify (sim AI) → mock CRM + **unified ticket API** → customer email sim → reply monitoring.

## Workflows (split)

| Workflow | Doc |
|----------|-----|
| `complaints-intake` | [[workflows/complaints/complaints-intake]] |
| `complaints-classify` | [[workflows/complaints/complaints-classify]] |
| `complaints-route` | [[workflows/complaints/complaints-route]] |
| `complaints-notify-customer` | [[workflows/complaints/complaints-notify-customer]] |
| `complaints-monitor-replies` | [[workflows/complaints/complaints-monitor-replies]] |

Full index: [[workflows/00-workflows-index]]. n8n testing: [[guides/workflow-testing]].

## Lib modules

- `lib/complaints/normalize.js` — artifact → `ComplaintRecord`
- `lib/complaints/classify.js` — sim AI classification
- `lib/complaints/route.js` — CRM + unified ticketing
- `lib/complaints/notify.js` — outbound email sim
- `lib/complaints/monitor.js` — reply thread linking
- `lib/complaints/pipeline.js` — E2E orchestration + smoke

## Run without n8n

```powershell
.\scripts\run.ps1 smoke-complaints
.\scripts\run.ps1 process-complaints
.\scripts\run.ps1 demo
```
