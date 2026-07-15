## ADDED Requirements

### Requirement: YAML workflow registration via HTTP
In addition to in-process factory registration, the Orchestrator HTTP API SHALL support registering workflows from Workflow YAML documents so cross-language clients can submit the same orchestration source of truth.

#### Scenario: from-yaml then start run
- **WHEN** a client successfully registers via `POST /workflows/from-yaml` and then calls `POST /workflows/{id}/runs`
- **THEN** execution begins for the registered workflow id

### Requirement: In-memory registry durability expectations
The system SHALL document that the workflow registry is process-memory scoped: registered workflows are lost when the Orchestrator process exits and must be re-registered; YAML files on disk are not deleted by a restart.

#### Scenario: Docs describe restart behavior
- **WHEN** an operator reads Orchestrator/SDK docs about registry lifetime
- **THEN** they understand re-registration is required after restart
