# Daily checks program overview

#n8n #daily-checks #program

**Status:** POC implemented

## Flow

1. SQL queries from `db/queries/daily-checks/*.sql` (fixture rows in POC)
2. `lib/daily-checks/triage.js` — AI summary + owner routing
3. Unified ticket via `POST /tickets` (`source_program: daily-checks`)
4. Cursor bundle in `DATA_ROOT/cursor-requests/{check_run_id}/{exception_id}/`

## Workflows

| Workflow | Doc |
|----------|-----|
| `dc-schedule-run` | [[workflows/daily-checks/dc-schedule-run]] |
| `dc-triage-exception` | [[workflows/daily-checks/dc-triage-exception]] |
| `dc-cursor-bundle` | [[workflows/daily-checks/dc-cursor-bundle]] |

Full index: [[workflows/00-workflows-index]]. n8n testing: [[guides/workflow-testing]].

## Smoke

```powershell
.\scripts\run.ps1 smoke-daily-checks
```
