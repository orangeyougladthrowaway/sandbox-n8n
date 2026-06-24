# ADR 005: Simulacrum pattern for external integrations

## Status
Accepted

## Context
No production credentials or external AI keys in POC.

## Decision
Every external integration has a sandbox substitute documented in [[integrations/catalog]]:
- Mailbox → `DATA_ROOT/inbound/mailbox/`
- AI → `lib/simulators/aiClient.js` + `sandbox-services` `/ai/analyze`
- CRM / ticketing → mock HTTP on localhost:3099
- Email → `DATA_ROOT/outbound/sent/`

## Consequences
- Swap simulators for real clients in production; keep schemas and lifecycle
