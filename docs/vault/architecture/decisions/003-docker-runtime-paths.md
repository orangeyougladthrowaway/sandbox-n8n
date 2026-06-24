# ADR 003: Native runtime and path conventions

## Status
Accepted (supersedes Docker path ADR)

## Context
Sandbox runs on host Node.js (including VMs without nested virtualization). No containers.

## Decision
| Env | Default (Windows host) |
|-----|------------------------|
| `N8N_REPO_ROOT` | workspace clone (e.g. `C:\repos\sandbox-n8n`) |
| `N8N_DATA_ROOT` | `C:\sandbox-dir\sandbox-n8n` |
| `MOCK_API_BASE_URL` | `http://localhost:3099` |

Workflow JSON and Code nodes use **host paths** (forward slashes OK in Code node strings).

## Consequences
- `lib/core/paths.js` reads env vars; no `/repo` or `/data` container paths
- n8n via `npm install -g n8n@1.80.0`; mock API via `run.ps1 mock-api`
