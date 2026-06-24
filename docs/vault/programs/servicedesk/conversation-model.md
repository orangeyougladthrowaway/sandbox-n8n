# Service desk conversation model

#n8n #servicedesk #conversation

## Turn model

Each `ConversationTurn` records: `at`, `actor` (bot | user | technician | system), `channel` (servicedesk_chat), `text`, `intent`.

## Bot persona

Env: `N8N_SERVICEDESK_BOT_TECH_ID` (default `bot-l1-sandbox`).

Tickets assigned to this ID are picked up by the queue poller.

## Handoff exit conditions

| Condition | Action |
|-----------|--------|
| User says "speak to a person" | Immediate handoff |
| Elicitation gaps closed | Handoff with summary |
| Max bot turns (5) | Handoff — insufficient detail |
| Critical priority + no KB match | Escalate without long chat |

## Priority queue

Poller sorts by `critical` → `high` → `medium` → `low`, then `created_at`.

## File-based chat (POC)

- Bot outbound: `DATA_ROOT/outbound/servicedesk/chat/{ticket_id}-bot-*.json`
- User inbound: `DATA_ROOT/inbound/servicedesk/chat/{ticket_id}-user-reply.json`

Log conversation turn **before** writing outbound file (see [[N8N-CODING-PRINCIPLES]]).
