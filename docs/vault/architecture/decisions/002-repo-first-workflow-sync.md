# ADR 002: Repo-first workflow sync

## Status
Accepted (amended — native runtime)

## Context
Workflow JSON in git is canonical. No n8n Enterprise Source Control in POC.

## Decision
- Workflows live in `workflows/**/*.json` in git
- Import via `.\scripts\run.ps1 import-workflows` (n8n CLI) or manual GUI import
- After GUI edits: export JSON from n8n → commit to repo
- No container-based auto-import

## Consequences
- Dual-editor loop documented in [[governance/development-loop]]
- Workflow paths use host `N8N_DATA_ROOT` / `N8N_REPO_ROOT` defaults
