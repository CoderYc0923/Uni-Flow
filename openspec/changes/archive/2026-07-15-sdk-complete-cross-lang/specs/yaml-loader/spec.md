## ADDED Requirements

### Requirement: Binding-assisted registry for HTTP uses
The YAML loading path used by Orchestrator registration SHALL accept a bindings map that materializes non-builtin `uses` entries as HTTP adapters (endpoint from binding), merging with any explicit plugin registry before resolving units.

#### Scenario: Binding supplies demo.greeter
- **WHEN** createEngineFromYaml (or the Orchestrator registration helper) receives registry/bindings mapping `demo.greeter` to an HTTP endpoint
- **THEN** the unit resolves and can execute via HttpAdapter without a custom in-process factory for that name
