# Complaints intake workflow

#n8n #workflow #complaints

## Purpose
Demonstrate complaints intake: copy fixture → full lib pipeline → return classified record.

## Trigger
Manual Trigger (POC).

## Node chain
1. Manual Trigger
2. Process fixture complaint (Code → `lib/complaints/pipeline.js`)

## Sandbox

- Writes only under `N8N_DATA_ROOT` (`inbound/`, `_runtime/`, `outbound/sent/`)
- HTTP to mock-api only when `N8N_MOCK_API_ENABLED=1` (otherwise in-process sim refs)
- Completes without mock-api running

## Manual test

1. `.\scripts\run.ps1 n8n` (optional: `mock-api` in another terminal)
2. Import workflow; execute manually
3. Inspect output `json` for classification and `ticket_ref`

See [[governance/sandbox-boundaries]].
