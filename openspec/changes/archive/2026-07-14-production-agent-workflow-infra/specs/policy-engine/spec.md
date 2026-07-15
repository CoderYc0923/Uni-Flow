## ADDED Requirements

### Requirement: Retry with backoff
The system SHALL retry failed unit executions according to configured retry policy with fixed or exponential backoff.

#### Scenario: Transient failure retry
- **WHEN** a unit fails with a retryable error and attempts remain
- **THEN** PolicyEngine returns `{ action: 'retry', delayMs }` and the unit is re-executed after delay

#### Scenario: Max retries exceeded
- **WHEN** retry attempts are exhausted
- **THEN** PolicyEngine returns `{ action: 'abort', reason }` and the workflow terminates with checkpoint saved

### Requirement: Timeout enforcement
The system SHALL enforce per-unit and per-workflow timeouts, cancelling the RuntimeAdapter on breach.

#### Scenario: Unit timeout
- **WHEN** a unit exceeds its configured `unitMs` timeout
- **THEN** the engine calls `RuntimeAdapter.cancel()` and PolicyEngine decides retry or abort

### Requirement: Token and cost budget
The system SHALL track cumulative token usage and cost, aborting the workflow when budget limits are exceeded.

#### Scenario: Budget exceeded
- **WHEN** cumulative token usage exceeds `maxTokens` during a run
- **THEN** PolicyEngine returns `{ action: 'abort' }` and saves a final checkpoint

### Requirement: Circuit breaker
The system SHALL implement circuit breaker pattern, pausing execution when failure threshold is reached within a time window.

#### Scenario: Circuit opens
- **WHEN** consecutive unit failures reach `failureThreshold`
- **THEN** PolicyEngine returns `{ action: 'pause' }` and the workflow awaits manual intervention or reset timeout

### Requirement: Parallel failure strategy
The system SHALL support configurable failure strategies for ParallelFlow: fail-fast, collect-errors, and best-effort.

#### Scenario: Collect-errors in parallel
- **WHEN** one unit fails in a ParallelFlow with `failureStrategy: 'collect-errors'`
- **THEN** the error is recorded in SharedState and remaining units continue execution
