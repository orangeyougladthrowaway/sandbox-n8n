# Sandbox boundaries

#n8n #governance #sandbox

Mandatory rules enforced in `lib/core/sandbox.js`:

## Write scope

| Allowed | Blocked |
|---------|---------|
| `N8N_DATA_ROOT/**` (default `C:\sandbox-dir\sandbox-n8n`) | Git repo (`N8N_REPO_ROOT`) |
| `_smoke/**` under data root (tests) | Any path outside data root |

All file writes (`FileComplaintStore`, `FileServiceDeskStore`, outbound email/chat sim, Teams JSON) call `assertWritePathUnderDataRoot`.

## HTTP scope

| Allowed | Blocked |
|---------|---------|
| `http://localhost:*` (mock-api) | External hosts |
| | HTTPS outbound |

Set `N8N_MOCK_API_ENABLED=1` only when `run.ps1 mock-api` is running. Otherwise pipelines use in-process simulators (`crm_sim_*`, `tkt_sim_*`).

## Git hygiene

Runtime artefacts live **outside** the repo. `.gitignore` also blocks accidental `_runtime/` or `.env` in the repo.

## n8n state

`%USERPROFILE%\.n8n` — local only, never committed.

## Workflows

- Import from `workflows/**/*.json`
- Code nodes default `N8N_REPO_ROOT` / `N8N_DATA_ROOT` to host paths
- Complaints intake completes without mock-api (simulated CRM/ticket refs)

See [[governance/sandbox-vs-prod]] · [[integrations/catalog]]
