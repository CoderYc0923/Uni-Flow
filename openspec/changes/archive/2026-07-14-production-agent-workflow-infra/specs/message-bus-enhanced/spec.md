## ADDED Requirements

### Requirement: Extended message types
The system SHALL support additional message types for checkpoint, policy-violation, hitl-request, hitl-response, and cost-update events.

#### Scenario: Checkpoint message published
- **WHEN** CheckpointStore saves a snapshot
- **THEN** MessageBus publishes a `checkpoint` message with runId and snapshotId

#### Scenario: HITL request message
- **WHEN** SecurityGovernance triggers a HITL gate
- **THEN** MessageBus publishes a `hitl-request` message with action details and payload

### Requirement: Message delivery semantics
The system SHALL support configurable delivery guarantee: at-least-once (default) or exactly-once.

#### Scenario: At-least-once delivery
- **WHEN** a message is published with `deliveryGuarantee: 'at-least-once'`
- **THEN** all active subscribers receive the message at least once

### Requirement: Synchronous publish
The system SHALL provide `publishSync` that blocks until all subscribers have processed the message.

#### Scenario: Sync publish for critical events
- **WHEN** a `hitl-request` message is published via `publishSync`
- **THEN** the publisher waits until all subscribers acknowledge processing

### Requirement: Message history with filtering
The system SHALL support filtered message history retrieval by type, sourceUnitId, and time range.

#### Scenario: Filtered history query
- **WHEN** `history({ type: 'unit-output', sourceUnitId: 'planner' })` is called
- **THEN** only matching messages are returned in chronological order
