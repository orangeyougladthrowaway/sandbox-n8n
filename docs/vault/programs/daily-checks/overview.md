# Daily checks program overview

#n8n #daily-checks #program

**Status:** POC implemented

## Flow

1. SQL queries from `db/queries/daily-checks/*.sql` (fixture rows in POC)
2. `lib/daily-checks/triage.js` — AI summary + owner routing
3. Unified ticket via `POST /tickets` (`source_program: daily-checks`)
4. Cursor bundle in `DATA_ROOT/cursor-requests/{check_run_id}/{exception_id}/`

## Workflows

| Workflow | Role |
|----------|------|
| `dc-schedule-run` | Run queries, collect exceptions |
| `dc-triage-exception` | Triage row + create ticket |
| `dc-cursor-bundle` | Write investigation bundle |

## Smoke

```powershell
.\scripts\run.ps1 smoke-daily-checks
```
