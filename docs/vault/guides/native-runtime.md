# Native runtime (no containers)

#n8n #guide #sandbox

This sandbox runs entirely on **Node.js on the host** — suitable for VMs without nested virtualization.

## Processes

| Command | What runs | Port |
|---------|-----------|------|
| `run.ps1 test` / `demo` | lib + smoke scripts | — |
| `run.ps1 mock-api` | `sandbox-services/server.js` | 3099 |
| `run.ps1 n8n` | global n8n CLI | 5678 |
| `run.ps1 import-workflows` | imports all JSON under `workflows/` | — |

## Persistence (DATA_ROOT)

| Data | Location |
|------|----------|
| Complaint records | `_runtime/complaints-db.json` |
| Service desk tickets | `_runtime/servicedesk-db.json` |
| Inbound/outbound files | `inbound/`, `outbound/` |
| Cursor bundles | `cursor-requests/` |
| n8n credentials/state | `%USERPROFILE%\.n8n` (outside repo) |

## Workflows in n8n

22 thin workflows — see [[workflows/00-workflows-index]] and [[guides/workflow-testing]].

## SQL schema

`db/schema/` and `db/queries/` are reference SQL; POC uses fixture rows in lib, not a live database.

## Related

- [[guides/getting-started]]
- [[workflows/data-flow]]
