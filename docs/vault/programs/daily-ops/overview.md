# Daily ops program overview

#n8n #daily-ops #program

**Status:** POC implemented

## Flow

1. SQL queries from `db/queries/daily-ops/*.sql` (fixture rows)
2. `lib/daily-ops/triage.js` — owner team, dedupe open tasks
3. Teams sim: `DATA_ROOT/outbound/teams/*.json`

## Workflows

| Workflow | Role |
|----------|------|
| `do-schedule-run` | Run ops queries |
| `do-route-owners` | Route + Teams notification |

## Smoke

```powershell
.\scripts\run.ps1 smoke-daily-ops
```
