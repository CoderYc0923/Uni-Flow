# workflow-as-unit

## Purpose

Cross-project composition: domain projects expose a full internal workflow and a Unit-facing `/execute` surface for parent ControlFlow embedding.

## Requirements

### Requirement: Dual view of domain projects
A domain project MAY expose both (1) a complete internal Uni-Flow workflow and (2) a Unit-facing HTTP (or in-process) execute surface that maps `AgentInput` to an internal run and returns `AgentOutput`. Parent workflows MUST be able to treat the child as a single Unit without knowledge of the child's ControlFlow topology.

#### Scenario: Parent embeds child as unit
- **WHEN** a parent workflow unit is bound to a child's `/execute` (or in-process wrapper) endpoint
- **THEN** the parent completes that unit based on `AgentOutput` without requiring the parent YAML to list the child's internal unit ids

### Requirement: Unit execute is the composition primary path
Cross-project composition for embedding a child capability inside a parent ControlFlow SHALL use the Unit execute contract (HttpAdapter / `builtin.http` / equivalent). Orchestrator workflow-run APIs (`POST /workflows/:id/runs` and related) MAY remain for standalone invocation, debugging, or batch jobs, but MUST NOT be required as the default parent-composition primitive.

#### Scenario: Docs distinguish composition vs standalone
- **WHEN** a reader opens the cross-project / uses guide
- **THEN** they can identify Unit `/execute` as the primary way to embed another project and workflow-run as a secondary/standalone path

### Requirement: Wrapper mapping responsibilities
A Workflow-as-Unit wrapper MUST: accept `AgentInput` (including optional `params`); map into internal workflow initial state or config; run the internal workflow to completion (or fail with a clear error); return a valid `AgentOutput`. The wrapper SHOULD propagate token usage when available.

#### Scenario: Wrapper returns AgentOutput
- **WHEN** a valid execute request is sent to a documented Workflow-as-Unit demo endpoint
- **THEN** the response body matches `AgentOutput` shape (`content`, `toolCalls`, `stopReason`, `metadata`)

### Requirement: Minimal demo exists
The repository SHALL provide at least one minimal Workflow-as-Unit (or extended cross-lang) demo showing a child service that runs an internal flow and exposes `/execute` for a parent workflow binding.

#### Scenario: Demo path documented
- **WHEN** a maintainer follows the demo README steps
- **THEN** they can start the child execute endpoint, register a parent workflow with a binding, and obtain a successful sync run

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
