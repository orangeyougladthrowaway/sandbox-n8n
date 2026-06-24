# Sandbox vs production

#n8n #governance #sandbox

POC uses **simulacrums only** on the **host** — no containers, no production endpoints.

| Area | POC | Production path |
|------|-----|-----------------|
| Runtime | Node.js + global n8n CLI | Managed n8n or K8s |
| Integrations | [[integrations/catalog]] — files + localhost:3099 | Real APIs + credential store |
| AI | `lib/simulators/aiClient.js` | Provider API |
| Data | JSON file store + file drops | Postgres + real channels |

See [[guides/native-runtime]] and [[governance/sandbox-boundaries]].
