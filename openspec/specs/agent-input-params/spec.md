# agent-input-params

## Purpose

Standard business-strategy envelope on `AgentInput.params`: SharedState mapping, merge priority with `unit.config`, and secrets ban.

## Requirements

### Requirement: Optional params on AgentInput
The system SHALL define `AgentInput` with an optional `params` field of type open object / `Record<string, unknown>` (or language equivalent). The Engine and HttpAdapter MUST pass `params` through without interpreting domain-specific keys.

#### Scenario: Params reach the adapter
- **WHEN** a Unit's `inputAdapter` returns `{ task, params: { topK: 5 } }`
- **THEN** `RuntimeAdapter.execute` receives the same `params` object (or equivalent JSON) without Engine stripping unknown keys

### Requirement: State to params mapping
The system SHALL document and implement a SharedState convention so that workflow/run input can supply params: key `input.params` and/or top-level run input field `params` maps into `AgentInput.params`.

#### Scenario: Run input params available to unit
- **WHEN** `engine.run({ task: "q", params: { retrievalMode: "fast" } })` (or equivalent state seed) is used with the default YAML inputAdapter
- **THEN** the executed Unit receives `params.retrievalMode === "fast"` (or equivalent)

### Requirement: Merge priority with unit.config
When both static `unit.config` defaults and runtime `params` apply to a capability, runtime `params` MUST override same-named keys from `unit.config` defaults. Implementations MAY document this merge inside Workflow-as-Unit wrappers and plugins; the Engine MUST NOT invent a second merge layer beyond transparent pass-through of `AgentInput`.

#### Scenario: Runtime overrides default
- **WHEN** a wrapper's defaults include `topK: 10` and runtime `params` include `topK: 3`
- **THEN** the effective strategy used by the wrapper uses `topK: 3`

### Requirement: Params must not carry secrets
Documentation and contracts MUST state that `params` MUST NOT contain secrets or credentials; secrets belong in bindings headers / `ExecutionContext.secrets` (or equivalent).

#### Scenario: Contract forbids secrets in params
- **WHEN** an integrator reads the AgentInput / Remote Unit contract notes
- **THEN** they are instructed not to put API keys or tokens inside `params`
