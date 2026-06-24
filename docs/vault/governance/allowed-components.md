# Allowed components

#n8n #governance

## Permitted node types (POC)

Manual Trigger, Schedule Trigger, Local File Trigger, Read/Write File, Set, IF, Switch, Code (thin), HTTP Request, Execute Workflow, Sticky Note.

## Banned patterns

- Business logic-only Code nodes (must delegate to `lib/`)
- Continue On Fail without documented error path
- Production URLs or credentials in JSON
- Silent empty returns on validation failure
