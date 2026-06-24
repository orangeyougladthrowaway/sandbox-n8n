# ADR 008 — Service desk conversation and handoff model

#n8n #adr #servicedesk

**Status:** Accepted

## Context

Service desk POC requires multi-turn bot chat with explicit handoff to human technicians.

## Decision

- Bot persona: `N8N_SERVICEDESK_BOT_TECH_ID` (default `bot-l1-sandbox`)
- Conversation turns logged append-only before outbound chat writes
- File-based chat for POC (`inbound/servicedesk/chat/`, `outbound/servicedesk/chat/`)
- Handoff triggers: user request, max turns, elicitation complete, critical + low KB

## Consequences

- `lib/servicedesk/conversation.js` owns exit evaluation
- Workflows stay thin; orchestration via `sd-queue-poller` entry point
