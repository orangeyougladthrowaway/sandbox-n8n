# Getting started

#n8n #guide #sandbox #native

## Prerequisites

- Node.js 18+
- PowerShell 5.1+
- Data folders at `C:\sandbox-dir\sandbox-n8n` (see below)
- **n8n** (optional, for canvas): `npm install -g n8n@1.80.0`

No Docker or Postgres required.

## Bootstrap

```powershell
cd C:\repos\sandbox-n8n
.\scripts\run.ps1 test
.\scripts\run.ps1 demo
```

## Data root (one-time)

```powershell
$data = 'C:\sandbox-dir\sandbox-n8n'
@(
  'inbound\mailbox\replies','inbound\scans','inbound\transcripts','inbound\servicedesk\chat',
  'outbound\sent','outbound\teams','outbound\servicedesk\chat',
  'cursor-requests','_runtime'
) | ForEach-Object { New-Item -ItemType Directory -Force -Path (Join-Path $data $_) | Out-Null }
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `N8N_REPO_ROOT` | repo clone path | Code nodes import `lib/` from here |
| `N8N_DATA_ROOT` | `C:\sandbox-dir\sandbox-n8n` | Runtime file tree |
| `MOCK_API_BASE_URL` | `http://localhost:3099` | Unified tickets, CRM, AI, KB |
| `N8N_SERVICEDESK_BOT_TECH_ID` | `bot-l1-sandbox` | Service desk poller assignee |

`.\scripts\run.ps1 n8n` and `mock-api` set repo/data env automatically.

## Import workflows

**Option A — CLI** (n8n installed globally):

```powershell
.\scripts\run.ps1 import-workflows
```

**Option B — GUI**

1. `.\scripts\run.ps1 n8n`
2. Open http://localhost:5678
3. Import from `workflows/` (all programs + `_shared/`)

## Mock integrations

```powershell
.\scripts\run.ps1 mock-api   # :3099 — unified /tickets, CRM, AI, KB
```

## Vault

Open `docs/vault/` in Obsidian. Start at [[00-MOC-platform]].

## Related

- [[guides/native-runtime]]
- [[testing/strategy]]
- [[programs/servicedesk/overview]]
