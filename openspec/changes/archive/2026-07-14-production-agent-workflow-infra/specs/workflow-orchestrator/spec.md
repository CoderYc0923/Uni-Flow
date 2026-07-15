## ADDED Requirements

### Requirement: Workflow execution engine
The system SHALL provide a WorkflowEngine that orchestrates ControlFlow scheduling, unit execution via RuntimeAdapter, and Layer 4 infrastructure hooks in the defined execution pipeline order.

#### Scenario: Full execution pipeline
- **WHEN** a workflow run is started
- **THEN** the engine executes: PolicyEngine.preCheck → SecurityGovernance.preHook → ContextManager.assemble → RuntimeAdapter.execute → post-hooks → CheckpointStore.save → Observability.emit for each scheduled unit

#### Scenario: Workflow completion
- **WHEN** ControlFlow.isComplete() returns true
- **THEN** the engine returns WorkflowResult with state, messages, completedUnits, duration, and cost metadata

### Requirement: External API for workflow management
The system SHALL expose REST API endpoints for starting runs, querying status, resuming from checkpoint, and responding to HITL requests.

#### Scenario: Start workflow run
- **WHEN** `POST /workflows/{id}/runs` is called with input payload
- **THEN** a new run is created and execution begins asynchronously

#### Scenario: Resume workflow run
- **WHEN** `POST /workflows/{id}/runs/{runId}/resume` is called
- **THEN** the engine loads the latest checkpoint and continues execution

### Requirement: Cross-language SDK contract
The system SHALL define a language-agnostic SDK contract (REST/gRPC) implemented by TypeScript, Python, and Java SDKs with identical semantics.

#### Scenario: Python SDK workflow submission
- **WHEN** a Python project uses `uniflow_sdk.client.start_workflow(id, input)`
- **THEN** the request is sent to the Orchestrator service and returns a runId

### Requirement: Phased delivery
The system SHALL support three deployment phases: Phase 1 in-process TS reference, Phase 2 standalone Orchestrator service with MCP, Phase 3 multi-language SDKs.

#### Scenario: Phase 1 in-process mode
- **WHEN** no Orchestrator service URL is configured
- **THEN** the SDK runs all Layer 4 components in-process with in-memory backends
