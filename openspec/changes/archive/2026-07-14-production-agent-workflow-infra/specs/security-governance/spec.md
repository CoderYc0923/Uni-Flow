## ADDED Requirements

### Requirement: Authorization checks
The system SHALL verify caller identity and unit/tool-level permissions before unit execution via `preHook`.

#### Scenario: Unauthorized unit access
- **WHEN** a caller lacks permission for a target unit
- **THEN** SecurityGovernance returns `{ action: 'deny', reason }` and the unit is not executed

### Requirement: Tool policy enforcement
The system SHALL validate tool calls against a whitelist and parameter JSON Schema before execution.

#### Scenario: Tool not in whitelist
- **WHEN** a unit attempts to call a tool not in the configured whitelist
- **THEN** SecurityGovernance denies the call and logs an audit event

### Requirement: Secret management
The system SHALL inject secrets via SecretMgr at runtime. SharedState and logs MUST NOT contain plaintext secrets.

#### Scenario: Secret injection
- **WHEN** a unit requires API credentials
- **THEN** SecretMgr resolves SecretRef to plaintext only within the execution context, never persisting to SharedState

### Requirement: PII detection and sanitization
The system SHALL detect and sanitize PII in unit inputs and outputs via PIIGuard in preHook and postHook.

#### Scenario: PII in output
- **WHEN** unit output contains detected PII (email, phone, etc.)
- **THEN** PIIGuard redacts sensitive fields before writing to SharedState and MessageBus

### Requirement: Audit trail
The system SHALL log all security-relevant events (auth checks, tool calls, HITL decisions) to an immutable audit trail.

#### Scenario: Tool call audit
- **WHEN** a tool is executed within a unit
- **THEN** an audit entry is created with caller, unitId, tool name, timestamp, and outcome

### Requirement: Human-in-the-loop gate
The system SHALL pause workflow execution and request human approval for operations flagged as high-risk.

#### Scenario: HITL trigger
- **WHEN** SecurityGovernance detects a high-risk operation (e.g., production deployment tool)
- **THEN** it returns `{ action: 'require-hitl' }`, saves a checkpoint, and publishes a `hitl-request` message

#### Scenario: HITL approval resumes workflow
- **WHEN** an approver responds with approval via API
- **THEN** the workflow resumes from checkpoint and the pending operation proceeds

### Requirement: Prompt injection defense
The system SHALL scan user inputs for prompt injection patterns before context assembly.

#### Scenario: Injection detected
- **WHEN** user input matches injection detection rules
- **THEN** the input is sanitized or rejected with an audit log entry
