## ADDED Requirements

### Requirement: Default inputAdapter maps params
When the YAML loader constructs a Unit via the default adapter wrapper (adapter-only plugin result), the default `inputAdapter` MUST map SharedState keys `task` and `context` as today, and MUST map params from `input.params` and/or top-level `params` on SharedState into `AgentInput.params` when present.

#### Scenario: Default wrapper passes params
- **WHEN** a YAML-loaded builtin/mock unit runs after `engine.run({ task: "t", params: { mode: "fast" } })` (or state seeded equivalently)
- **THEN** the adapter `execute` input includes `params.mode === "fast"` (or equivalent)

#### Scenario: Missing params remains optional
- **WHEN** a run supplies only `task` and no params keys
- **THEN** loading and execution succeed and `params` is omitted or undefined without error
