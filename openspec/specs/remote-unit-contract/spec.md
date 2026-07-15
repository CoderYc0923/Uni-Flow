# remote-unit-contract

## Purpose

HTTP Unit request/response contract aligned with HttpAdapter, plus golden fixtures for cross-language units.

## Requirements

### Requirement: Documented HTTP Unit JSON contract
The repository SHALL publish a short contract description for remote Units consumed by `HttpAdapter`: request carries agent input (and optional context fields as implemented), response body matches `AgentOutput` shape (`content`, `toolCalls`, `stopReason`, `metadata`, optional `tokenUsage`).

#### Scenario: Contract file present
- **WHEN** an integrator opens the remote unit contract doc (or README section)
- **THEN** they can implement a greeter HTTP handler that the Orchestrator can call

### Requirement: Golden fixtures for unit HTTP
The test suite SHALL include golden request/response fixtures exercised against HttpAdapter (or equivalent) so cross-lang demo units can match the same shapes.

#### Scenario: Fixture round-trip
- **WHEN** tests feed the golden response shape through the HTTP adapter path (mock fetch or test server)
- **THEN** the engine obtains a valid AgentOutput without schema surprises
