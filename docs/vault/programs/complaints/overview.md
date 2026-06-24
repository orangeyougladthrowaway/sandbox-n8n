# Complaints program overview

#n8n #complaints #program

POC scope: multi-channel intake (mailbox eml, scan, transcript) → normalize → classify (sim AI) → mock CRM + **unified ticket API** → customer email sim → reply monitoring.

## Workflows (split)

| Workflow | Step |
|----------|------|
| `complaints-intake` | Normalize + persist |
| `complaints-classify` | Classify |
| `complaints-route` | CRM + `POST /tickets` (`source_program: complaints`) |
| `complaints-notify-customer` | Outbound email sim |
| `complaints-monitor-replies` | Reply thread linking |

Shared sub-workflows in `workflows/_shared/`.

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
