# Native runtime (no containers)

#n8n #guide #sandbox

This sandbox runs entirely on **Node.js on the host** — suitable for VMs without nested virtualization.

## Processes

| Command | What runs | Port |
|---------|-----------|------|
| `run.ps1 test` / `demo` | lib + smoke scripts | — |
| `run.ps1 mock-api` | `sandbox-services/server.js` | 3099 |
| `run.ps1 n8n` | global n8n CLI | 5678 |

## Persistence

| Data | Location |
|------|----------|
| Complaint records (demo) | `DATA_ROOT/_runtime/complaints-db.json` |
| Inbound/outbound files | `DATA_ROOT/inbound/`, `outbound/` |
| n8n credentials/state | `%USERPROFILE%\.n8n` (gitignored) |

## SQL schema

`db/schema/` is reference DDL for future Postgres use. The POC uses **FileComplaintStore** only.

## Future: containers

Docker Compose was removed from this repo. A future ADR may reintroduce optional container packaging for hosts that support it.
