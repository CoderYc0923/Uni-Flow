## ADDED Requirements

### Requirement: Workflow YAML document model
The system SHALL accept Workflow documents with `apiVersion: uniflow/v1`, `kind: Workflow`, `metadata.id`, and `spec` containing `units`, `flow`, and optional `entry` / `policy`.

#### Scenario: Minimal valid document
- **WHEN** a YAML document provides required `apiVersion`, `kind`, `metadata.id`, at least one unit, and a supported `flow.type`
- **THEN** the document is considered structurally valid against the published schema

#### Scenario: Reject unknown apiVersion
- **WHEN** `apiVersion` is missing or not `uniflow/v1`
- **THEN** validation fails with an error identifying the version field

### Requirement: Units declare uses
Each entry in `spec.units` MUST include `id` and `uses`. Optional fields MAY include `config`, `contextPolicy`, and `policyOverrides`. Units MUST NOT embed prompt bodies, SQL, or secret values as required schema fields.

#### Scenario: Unit with plugin reference
- **WHEN** a unit specifies `uses: accounting.record` and optional `config`
- **THEN** the schema accepts the unit and treats `config` as an opaque object for plugin consumption

### Requirement: Flow types mapping surface
The schema SHALL support `flow.type` values: `sequential`, `parallel`, `router`, `loop`, `dag`, and `delegation`. Router flows MUST declare `routerUnit` and `routes`. DAG flows MUST declare dependency edges in a schema-defined form.

#### Scenario: Router flow schema
- **WHEN** `flow.type` is `router` with `routerUnit` and a `routes` map of route-key to unit-id
- **THEN** the schema accepts the document

#### Scenario: Unsupported composite in v1
- **WHEN** a document uses a composite nesting form not supported by v1 schema
- **THEN** validation fails or the form is omitted from the schema so invalid documents cannot claim compliance

### Requirement: Workflow-level policy in YAML
The schema SHALL allow optional `spec.policy` with retry, timeout, and budget fields aligned to the engine policy model (e.g. `maxAttempts`, `unitMs`/`workflowMs`, `maxTokens`/`maxCost`).

#### Scenario: Policy defaults declared
- **WHEN** `spec.policy.timeout.unitMs` and `spec.policy.budget.maxTokens` are set
- **THEN** the schema accepts the values for Loader to apply as workflow defaults

### Requirement: Published JSON Schema artifact
The repository SHALL publish `schemas/uniflow.workflow.schema.json` usable by editors, CLI, and Loader as the single source of truth for document validation.

#### Scenario: Schema file present
- **WHEN** a consumer opens the published schema path
- **THEN** it validates documents conforming to the requirements above
