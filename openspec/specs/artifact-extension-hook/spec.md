# artifact-extension-hook

## Purpose

Document the reserved `artifacts` extension key for future multimodal work; engine pass-through only in v1.

## Requirements

### Requirement: Artifacts extension key documented
The repository SHALL document that `artifacts` MAY appear on `AgentOutput.metadata` and/or SharedState as an array of objects with suggested fields `{ id, uri?, mimeType?, label? }`, that SDKs and the engine MUST pass the field through without interpreting it in v1, and that callers MUST NOT depend on engine-side artifact processing.

#### Scenario: Docs state pass-through only
- **WHEN** a reader opens the artifacts extension notes (README/AGENTS/design pointer)
- **THEN** they see that artifacts are reserved for a future version and are not processed by the current engine
