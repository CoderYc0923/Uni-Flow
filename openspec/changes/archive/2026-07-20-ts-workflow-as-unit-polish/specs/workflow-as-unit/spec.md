## ADDED Requirements

### Requirement: Demo framed as two TS deployments
The Workflow-as-Unit example README SHALL describe the child execute server and parent orchestrator/bindings flow as two TypeScript deployment units (even if co-located in one repo), including ports, bindings key, and `params` example.

#### Scenario: README names parent and child roles
- **WHEN** a maintainer opens `examples/workflow-as-unit/README.md`
- **THEN** they can identify which process is the child Unit server and which is the parent workflow runner

### Requirement: Optional reusable wrapper helper
The TypeScript package MAY export a small helper that loads Workflow YAML and handles an execute-style request into `AgentOutput`, used by the child demo to reduce duplicated boilerplate. If not exported, the demo MUST still keep a single clear wrapper module documented as the copy template.

#### Scenario: Child demo stays thin
- **WHEN** a reader inspects the child execute entrypoint
- **THEN** the mapping from `AgentInput` to internal `engine.run` is localized in one module or helper
