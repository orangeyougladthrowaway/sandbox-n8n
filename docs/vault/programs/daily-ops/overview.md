# Daily ops program overview

#n8n #daily-ops #program

**Status:** POC implemented

## Flow

1. SQL queries from `db/queries/daily-ops/*.sql` (fixture rows)
2. `lib/daily-ops/triage.js` — owner team, dedupe open tasks
3. Teams sim: `DATA_ROOT/outbound/teams/*.json`

## Workflows

| Workflow | Doc |
|----------|-----|
| `do-schedule-run` | [[workflows/daily-ops/do-schedule-run]] |
| `do-route-owners` | [[workflows/daily-ops/do-route-owners]] |

Full index: [[workflows/00-workflows-index]]. n8n testing: [[guides/workflow-testing]].

## Smoke

```powershell
.\scripts\run.ps1 smoke-daily-ops
```
