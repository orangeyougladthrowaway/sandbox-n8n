# Folder layout

#n8n #architecture #platform

Two roots: git repo (code) and external data tree (runtime files). See [[00-MOC-platform]].

## Repo root (in git)

```
repo-root/
├── README.md
├── package.json
├── lib/
│   ├── core/
│   ├── schemas/
│   ├── complaints/
│   ├── servicedesk/
│   ├── daily-checks/
│   ├── daily-ops/
│   └── simulators/
├── workflows/
│   ├── _shared/
│   ├── complaints/
│   ├── servicedesk/
│   ├── daily-checks/
│   └── daily-ops/
├── fixtures/
├── prompts/
├── sandbox-services/server.js
├── db/schema/ db/queries/
├── tests/
├── scripts/run.ps1
└── docs/vault/
```

## Data root (outside git)

Default: `C:\sandbox-dir\sandbox-n8n` (`N8N_DATA_ROOT`).

```
DATA_ROOT/
├── inbound/mailbox/ scans/ transcripts/ servicedesk/chat/
├── outbound/sent/ teams/ servicedesk/chat/
├── cursor-requests/
├── _runtime/               ← JSON stores
└── _smoke/                 ← idempotent test workspaces
```

## Path resolution

Implemented in `lib/core/paths.js`. Set `N8N_REPO_ROOT` and `N8N_DATA_ROOT` before n8n or scripts if not using defaults.

## Related

- [[guides/native-runtime]]
- [[architecture/decisions/003-docker-runtime-paths]]
