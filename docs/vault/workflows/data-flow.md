# Data flow

#n8n #workflow #mermaid

All side effects stay under `N8N_DATA_ROOT` — see [[governance/sandbox-boundaries]].

## Unified ticketing (all programs)

```mermaid
flowchart LR
  subgraph mock [localhost:3099 mock-api]
    TAPI[GET/POST/PATCH /tickets]
    KB[GET /kb/search]
  end

  CMP[complaints route] --> TAPI
  DC[daily-checks triage] --> TAPI
  SD[servicedesk poller] --> TAPI
```

## Complaints classification

```mermaid
flowchart TD
  IN[Inbound .eml] --> NORM[normalizeInboundArtifact]
  NORM --> CLASS[classifyComplaint]
  CLASS --> ROUTE[routeComplaint → /tickets + /crm]
  ROUTE --> NOTIFY[notifyCustomer]
  NOTIFY --> DB[(FileComplaintStore)]
  REPLY[Reply .eml] --> MON[processReply]
  MON --> DB
```

## Service desk (single entry point)

```mermaid
flowchart TD
  POLL[sd-queue-poller] --> API[GET /tickets?assignee=bot-l1-sandbox]
  API --> INTAKE[normalize + store]
  INTAKE --> CT[classify + triage + KB]
  CT --> BOT[bot chat → outbound/servicedesk/chat/]
  BOT --> AWAIT[sd-await-user ← inbound/servicedesk/chat/]
  AWAIT --> HAND[sd-handoff-technician]
  HAND --> PATCH[PATCH /tickets assignee]
  HAND --> STORE[(FileServiceDeskStore)]
```

## Daily checks

```mermaid
flowchart TD
  Q[SQL fixtures] --> TRI[triageException]
  TRI --> TKT[POST /tickets source_program=daily-checks]
  TRI --> CUR[writeCursorBundle → cursor-requests/]
```

## Daily ops

```mermaid
flowchart TD
  Q[SQL fixtures] --> TRI[triageOpsTask]
  TRI --> TEAMS[outbound/teams/*.json]
```

## Related

- [[workflows/00-workflows-index]]
- [[integrations/catalog]]
- [[architecture/decisions/009-unified-ticket-api]]
- [[programs/servicedesk/overview]]
