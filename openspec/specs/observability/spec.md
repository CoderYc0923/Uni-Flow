# observability

## Purpose

Traces, metrics, structured logs, and token/cost tracking for workflow runs.

## Requirements

### Requirement: Distributed tracing
The system SHALL emit hierarchical spans for workflow, unit, and tool-call levels, compatible with OpenTelemetry.

#### Scenario: Workflow span hierarchy
- **WHEN** a workflow run starts
- **THEN** a root span is created, and each unit execution creates a child span linked by traceId

#### Scenario: Framework attribution
- **WHEN** a unit executes via a RuntimeAdapter
- **THEN** the span includes `framework.name` and `framework.version` tags from `frameworkInfo()`

### Requirement: Metrics and cost tracking
The system SHALL record metrics for latency, success rate, token usage, and cost per unit and per workflow run.

#### Scenario: Token usage recording
- **WHEN** an LLM call completes within a unit
- **THEN** Observability records token count and estimated cost, accumulating at run level

#### Scenario: Run-level cost summary
- **WHEN** a workflow run completes
- **THEN** the final snapshot metadata includes total tokenUsage and cost

### Requirement: Structured logging
The system SHALL emit structured JSON logs correlated with traceId and runId for all significant events.

#### Scenario: Error logging with correlation
- **WHEN** a unit execution fails
- **THEN** a structured error log is emitted with traceId, runId, unitId, and error details
