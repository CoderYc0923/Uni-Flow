## ADDED Requirements

### Requirement: Workflow snapshot persistence
The system SHALL persist `WorkflowSnapshot` containing sharedState, controlFlowCursor, completedUnits, messageBusHistory, and metadata after each unit completion.

#### Scenario: Auto-checkpoint after unit
- **WHEN** a WorkflowUnit completes successfully
- **THEN** CheckpointStore saves a snapshot and returns a snapshotId

#### Scenario: HITL pause checkpoint
- **WHEN** a HITL Gate pauses the workflow
- **THEN** the snapshot includes `pendingHITL` with the approval request details

### Requirement: Workflow resume from checkpoint
The system SHALL support resuming a workflow run from any saved snapshot by restoring SharedState, ControlFlow cursor, and skipping completed units.

#### Scenario: Resume after failure
- **WHEN** a workflow run fails mid-execution and `resume(runId)` is called
- **THEN** the engine loads the latest snapshot and continues from the next pending unit

#### Scenario: Resume after HITL approval
- **WHEN** a HITL request is approved via API
- **THEN** the workflow resumes from the checkpoint and proceeds to the next unit

### Requirement: Pluggable storage backend
The system SHALL define a `CheckpointStore` interface with pluggable backends. The default implementation MUST support in-memory (Phase 1) and Redis (Phase 2+).

#### Scenario: In-memory backend for development
- **WHEN** no external storage is configured
- **THEN** CheckpointStore uses in-memory storage suitable for development and testing
