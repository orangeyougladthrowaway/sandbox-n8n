# Architecture overview

#n8n #architecture #sandbox #platform

## Purpose

Governed n8n operations sandbox POC with **four pipeline programs**: complaints, service desk, daily checks, and daily ops. **Native Node runtime** — no Docker. Unified ticketing via `sandbox-services` mock API; chat and email via file simulacrums.

Start at [[00-MOC-platform]].

## Layers

```
docs/vault/     — governance, ADRs, workflow specs
lib/ + tests/   — business logic, schemas, simulators
workflows/      — n8n orchestration only
DATA_ROOT       — runtime files (outside git)
```

## Two roots

| Root | Role |
|------|------|
| **Repo** (`N8N_REPO_ROOT`) | Code, workflows, fixtures, vault |
| **Data** (`N8N_DATA_ROOT`) | Runtime: `inbound/`, `outbound/`, `cursor-requests/`, `_runtime/` |

Default data path: `C:\sandbox-dir\sandbox-n8n`.

## Target n8n version

**1.80.0** — install globally: `npm install -g n8n@1.80.0`

## Runtime processes

| Process | Command |
|---------|---------|
| Tests / smoke | `.\scripts\run.ps1 test` |
| Mock tickets/CRM/AI/KB | `.\scripts\run.ps1 mock-api` |
| n8n canvas | `.\scripts\run.ps1 n8n` |

See [[guides/native-runtime]].

## Related

- [[architecture/folder-layout]]
- [[architecture/module-map]]
- [[00-MOC-platform]]
