# ADR 004: Canonical complaint schema and lifecycle

## Status
Accepted

## Context
Complaints program needs a normalized record shape and append-only lifecycle events.

## Decision
- Schema: `lib/schemas/complaint.js` (`ComplaintRecord`)
- Events: `received → normalized → classified → ticket_created → crm_synced → customer_notified → reply_received → updated → closed | escalated`
- Postgres tables: `complaint_records`, `complaint_events`
- Smoke tests use `FileComplaintStore` when Postgres unavailable

## Consequences
- Validate before side effects
- Lifecycle logged before external posts
