# Credentials catalog

#n8n #credentials #sandbox

**No credential values in git.** This catalog lists types only.

| Credential type | Purpose | Sandbox substitute |
|----------------|---------|-------------------|
| (none required for POC) | File-based intake and mock HTTP | No n8n credentials needed |

Future production:
- `httpHeaderAuth` — CRM/ticketing APIs
- `postgres` — n8n Postgres node (optional; lib uses `DATABASE_URL`)

Local exports and `.n8n/` runtime are gitignored.
