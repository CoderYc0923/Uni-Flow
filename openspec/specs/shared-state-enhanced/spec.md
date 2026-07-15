# shared-state-enhanced

## Purpose

Scoped SharedState with atomic transactions and a backward-compatible unscoped API.

## Requirements

### Requirement: State scoping
The system SHALL support four state scopes: workflow, unit, session, and global, each with distinct lifecycle boundaries.

#### Scenario: Workflow-scoped state
- **WHEN** a value is written via `state.scope('workflow').set('plan', steps)`
- **THEN** the value is accessible to all units in the current run but not to other runs

#### Scenario: Session-scoped state persists across runs
- **WHEN** a value is written via `state.scope('session').set('userPrefs', prefs)`
- **THEN** the value is accessible in subsequent workflow runs within the same session

### Requirement: Atomic transactions
The system SHALL support `transaction()` for atomic multi-key writes with optimistic locking for parallel unit safety.

#### Scenario: Successful transaction
- **WHEN** multiple keys are written within a `transaction()` block
- **THEN** all writes are applied atomically or none are applied

#### Scenario: Concurrent write conflict
- **WHEN** two parallel units attempt to write the same key via `transaction()`
- **THEN** one succeeds and the other receives a conflict error, triggering PolicyEngine retry

### Requirement: Backward-compatible API
The system SHALL maintain the original `get/set/delete/has/snapshot` API. Unscoped calls default to `workflow` scope.

#### Scenario: Legacy API compatibility
- **WHEN** code calls `state.set('plan', steps)` without explicit scope
- **THEN** the value is stored in workflow scope, preserving existing behavior
