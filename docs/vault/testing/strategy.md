# Testing strategy

#n8n #testing

## Runner

**Node.js built-in `node:test`**. No Docker or n8n required for green build.

```powershell
.\scripts\run.ps1 test
.\scripts\run.ps1 demo
```

## Scope

| Artefact | Coverage |
|----------|----------|
| `lib/` exports | Unit tests — happy + failure paths |
| Program smokes | `tests/program-smoke.test.js` + dedicated smoke scripts |
| Workflow JSON | Per-workflow docs in [[workflows/00-workflows-index]]; n8n verification in [[guides/workflow-testing]] |
| Mock API | Optional manual run; offline smokes use fixtures |

## Smoke tests (mandatory E2E)

| Command | Scope |
|---------|--------|
| `run.ps1 smoke-complaints` | 3 fixtures + reply escalation |
| `run.ps1 smoke-servicedesk` | VPN handoff, password, priority, awaiting_user |
| `run.ps1 smoke-daily-checks` | 2 queries → tickets + cursor bundles |
| `run.ps1 smoke-daily-ops` | 2 queries → Teams JSON |
| `run.ps1 demo` | All four smokes |

All smoke trees under `DATA_ROOT/_smoke/` — wiped before and after.

## Test files (80+ tests)

| File | Module |
|------|--------|
| `tests/paths.test.js` | paths |
| `tests/sandbox.test.js` | sandbox guards |
| `tests/schemas.test.js` | aiClient |
| `tests/ticket.test.js` | unified ticket schema |
| `tests/ticketing-kb.test.js` | ticket payloads + KB |
| `tests/complaints.test.js` | complaints lib |
| `tests/complaints-smoke.test.js` | complaints E2E |
| `tests/servicedesk.test.js` | servicedesk lib |
| `tests/servicedesk-pipeline.test.js` | store + pipeline |
| `tests/daily-checks.test.js` | daily checks |
| `tests/daily-ops.test.js` | daily ops |
| `tests/program-smoke.test.js` | all program smokes |

## Related

- [[guides/native-runtime]]
- [[guides/workflow-testing]]
- [[workflows/00-workflows-index]]
- [[N8N-CODING-PRINCIPLES#Testing]]
