# Nodes catalog

#n8n #nodes

Built-in nodes used in this sandbox. No custom node packages.

| Node | Workflows | Role | Why not Code? |
|------|-----------|------|---------------|
| Manual Trigger | All POC workflows | Start demo / manual run | — |
| Code | All POC workflows | Thin adapter to `lib/` | Domain logic lives in testable lib |
| Sticky Note | All POC workflows | Canvas summary + vault link | — |
| Schedule Trigger | *(future)* | `sd-queue-poller`, daily runs | Native scheduling when activated |

No HTTP Request nodes in workflow JSON — HTTP to mock API is invoked from Code nodes via `lib/core/http.js` when `N8N_MOCK_API_ENABLED=1`.

No credential-backed nodes in this repo.

## Related

- [[workflows/data-flow]]
- [[programs/servicedesk/overview]]
- [[N8N-CODING-PRINCIPLES#Node selection (built-in first)]]
