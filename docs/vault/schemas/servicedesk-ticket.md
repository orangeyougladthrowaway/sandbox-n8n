# Service desk ticket schema

#n8n #schema #servicedesk

See `lib/schemas/servicedesk-ticket.js`.

| Field | Type | Notes |
|-------|------|-------|
| id | string | Internal sandbox ID |
| external_ref | string | Unified API `ticket_ref` |
| status | enum | new → in_bot_triage → awaiting_user → with_technician → closed |
| priority | enum | critical, high, medium, low |
| classification | object | category, confidence, rationale |
| triage | object | queue, owner_team, suggested_action, sla_bucket |
| kb_matches | array | doc_id, title, excerpt, score |
| conversation | array | ConversationTurn[] |
| assignment | object | bot_technician_id, current_assignee, handoff_at, handoff_reason |
| lifecycle_events | array | Append-only audit trail |

Unified API tickets (`lib/schemas/ticket.js`) are the cross-program transport shape; service desk enrichments live in `FileServiceDeskStore`.
