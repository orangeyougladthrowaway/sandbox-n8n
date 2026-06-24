# ADR 006: Persistence — JSON file store (POC)

## Status
Accepted (amended — no Postgres in POC runtime)

## Context
VM constraints and simplicity favor zero external database for demos.

## Decision
- Runtime persistence: `FileComplaintStore` → `DATA_ROOT/_runtime/complaints-db.json`
- `db/schema/` retained as **reference DDL** for future Postgres
- No `DATABASE_URL` required for tests or demos

## Consequences
- All smoke/E2E tests run without Postgres
- SQL reporting demos are future work when a DB is available
