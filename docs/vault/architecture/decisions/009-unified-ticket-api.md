# ADR 009 — Unified ticket API

#n8n #adr #ticketing

**Status:** Accepted

## Context

Complaints, service desk, daily checks, and daily ops all create tickets. Separate mock endpoints duplicated shape and complicated polling.

## Decision

Single mock API resource at `/tickets` with:

- `source_program` discriminator
- Shared priority/status/assignee model
- `GET /tickets?assignee=bot-l1-sandbox` as service desk entry point (poll, no webhook)

CRM remains separate (`/crm/complaints`) for complaints sync only.

## Consequences

- `lib/simulators/ticketing.js` is the single client
- `lib/schemas/ticket.js` validates all program payloads
- Postgres DDL in `db/schema/` remains reference; runtime uses JSON stores + mock API
