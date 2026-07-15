# yaml-loader

## Purpose

Load and validate Workflow YAML, resolve `uses` plugins, and construct a runnable Engine via the existing `createWorkflowEngine` path.

## Requirements

### Requirement: Create engine from YAML
The system SHALL provide `createEngineFromYaml(source, options)` that parses YAML (file path or string), validates against the Workflow JSON Schema, resolves all `uses` entries, builds WorkflowUnits and ControlFlow, and returns an engine created via the existing `createWorkflowEngine` path.

#### Scenario: Load sequential workflow
- **WHEN** a valid sequential YAML and a registry covering every `uses` are provided
- **THEN** the returned engine can `run` a task and execute units in declared order

#### Scenario: Invalid schema rejected before run
- **WHEN** the YAML fails schema validation
- **THEN** `createEngineFromYaml` rejects with a structured error and does not construct an engine

### Requirement: Resolve uses via registry and builtins
The Loader MUST resolve each unit `uses` from `options.registry` or the builtin registry. Missing resolutions MUST fail at load time. P0 MUST include `builtin.mock`; MAY include minimal `builtin.http`.

#### Scenario: Missing plugin fails fast
- **WHEN** a unit references `uses: accounting.record` and the registry omits that key
- **THEN** loading fails with an error naming the unresolved `uses` string

#### Scenario: Builtin mock resolves without registry entry
- **WHEN** a unit uses `builtin.mock` and no custom registry entry is required
- **THEN** the Loader constructs a mock adapter suitable for tests/examples

### Requirement: Map flow declaration to ControlFlow
The Loader SHALL map supported `flow.type` values to the corresponding existing ControlFlow implementations, wiring unit ids from `spec.units` (and `entry` / routes / DAG edges as applicable).

#### Scenario: Router mapping
- **WHEN** YAML declares `flow.type: router` with `routerUnit` and `routes`
- **THEN** the engine uses RouterFlow such that the router unit output selects the mapped target unit

### Requirement: Apply YAML policy defaults
When `spec.policy` is present, the Loader MUST apply it as workflow-level defaults on the constructed engine configuration. Unit-level `policyOverrides` and `contextPolicy` MUST be attached to the corresponding WorkflowUnit.

#### Scenario: Timeout from YAML applied
- **WHEN** YAML sets `spec.policy.timeout.unitMs`
- **THEN** the constructed engine enforces that unit timeout through the existing PolicyEngine path

### Requirement: Code API remains available
The system MUST continue to export `createWorkflowEngine` for tests and cases not covered by YAML v1, sharing the same Engine/Layer4 implementation as the YAML path.

#### Scenario: Dual-track same engine
- **WHEN** one workflow is built via YAML and another via code API with equivalent topology
- **THEN** both execute through the same Engine type without a second orchestration runtime

### Requirement: Binding-assisted registry for HTTP uses
The YAML loading path used by Orchestrator registration SHALL accept a bindings map that materializes non-builtin `uses` entries as HTTP adapters (endpoint from binding), merging with any explicit plugin registry before resolving units.

#### Scenario: Binding supplies demo.greeter
- **WHEN** createEngineFromYaml (or the Orchestrator registration helper) receives registry/bindings mapping `demo.greeter` to an HTTP endpoint
- **THEN** the unit resolves and can execute via HttpAdapter without a custom in-process factory for that name
