# ADR 007: AI abstraction (sim vs prod)

## Status
Accepted

## Context
Classification and triage need AI-like behaviour without API keys.

## Decision
`lib/simulators/aiClient.js` exports `analyzeText` and `summarizeException` with deterministic keyword/fixture rules. Future production client implements the same function signatures.

## Consequences
- Code nodes and lib call `analyzeText`; never embed provider SDKs in POC
- Prompts versioned under `prompts/` for future wiring
