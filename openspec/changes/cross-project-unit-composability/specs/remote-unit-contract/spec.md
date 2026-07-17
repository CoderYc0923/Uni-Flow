## MODIFIED Requirements

### Requirement: Documented HTTP Unit JSON contract
The repository SHALL publish a short contract description for remote Units consumed by `HttpAdapter`: request carries agent input including `task`, optional `context`, optional `delegatedBy`, and optional `params` (open object), plus optional execution context fields as implemented; response body matches `AgentOutput` shape (`content`, `toolCalls`, `stopReason`, `metadata`, optional `tokenUsage`). The contract MUST note that `params` is pass-through and MUST NOT hold secrets.

#### Scenario: Contract file present
- **WHEN** an integrator opens the remote unit contract doc (or README section)
- **THEN** they can implement a greeter HTTP handler that the Orchestrator can call

#### Scenario: Contract documents params
- **WHEN** an integrator reads the request `input` schema in the contract
- **THEN** they see optional `params` and can round-trip it in a handler that echoes or uses those fields

## ADDED Requirements

### Requirement: HttpAdapter preserves params
`HttpAdapter` (or equivalent HTTP Unit path) MUST serialize the full `AgentInput` (including `params` when present) in the request body so remote Units receive the same envelope as in-process adapters.

#### Scenario: Params in HTTP body
- **WHEN** HttpAdapter executes with `input.params` set
- **THEN** the outbound JSON body includes `input.params` with the provided keys
