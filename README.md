# sandbox-n8n — Operations platform POC

Governed n8n sandbox with **four pipeline programs**: complaints, service desk, daily checks, and daily ops. Lib-first logic, **native Node runtime** (no Docker), unified ticketing API + file simulacrums — no production credentials.

**Target n8n version:** 1.80.0 (install globally via npm)

## Two roots

| Root | Path | Holds |
|------|------|--------|
| **Repo** | workspace clone (e.g. `C:\repos\sandbox-n8n`) | `lib/`, `workflows/`, `fixtures/`, `docs/vault/` |
| **Data** | `C:\sandbox-dir\sandbox-n8n` | `inbound/`, `outbound/`, `cursor-requests/`, `_runtime/` |

Override with `N8N_REPO_ROOT` and `N8N_DATA_ROOT`.

## Quick start

```powershell
cd C:\repos\sandbox-n8n
.\scripts\run.ps1 test           # 84 tests — lib smokes; n8n CLI test skipped if not installed
.\scripts\run.ps1 demo           # all program smokes
.\scripts\run.ps1 smoke-n8n      # optional: all 22 workflows via n8n CLI (~4 min)
```

### Programs

```powershell
.\scripts\run.ps1 smoke-complaints
.\scripts\run.ps1 smoke-servicedesk
.\scripts\run.ps1 smoke-daily-checks
.\scripts\run.ps1 smoke-daily-ops
.\scripts\run.ps1 process-complaints
.\scripts\run.ps1 process-servicedesk
```

### n8n canvas + mock API (two terminals)

```powershell
# Terminal 1 — unified ticketing, CRM, AI, KB
.\scripts\run.ps1 mock-api

# Terminal 2 — n8n
.\scripts\run.ps1 n8n
.\scripts\run.ps1 import-workflows   # first time only
```

Open http://localhost:5678 · Mock API: http://localhost:3099/health

## Architecture highlights

- **Single ticket entry point:** `sd-queue-poller` polls `GET /tickets?assignee=bot-l1-sandbox`
- **Unified model:** all programs use `/tickets` with `source_program`
- **Chat POC:** file drops under `inbound/servicedesk/chat/` and `outbound/servicedesk/chat/`

## Layout

| Path | Purpose |
|------|---------|
| `lib/` | Testable business logic by program |
| `workflows/` | Thin n8n JSON + `workflows/_shared/` |
| `fixtures/` | Sample inputs per program |
| `sandbox-services/server.js` | Mock API |
| `docs/vault/` | Obsidian vault — start at `00-MOC-platform.md`; workflows at `workflows/00-workflows-index.md` |

Standards: `docs/vault/N8N-CODING-PRINCIPLES`, `N8N-CODEBASE-DOCUMENTATION`.  
n8n workflow testing: `docs/vault/guides/workflow-testing.md`
