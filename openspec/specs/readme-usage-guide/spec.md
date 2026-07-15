# readme-usage-guide

## Purpose

Root README usage guide structure: full-pipeline diagrams, install/quick start, core concepts, end-to-end cases, and public API alignment.

## Requirements

### Requirement: Root README exists with usage guide structure
The repository SHALL provide a root `README.md` written primarily in Simplified Chinese that includes: project overview, full-pipeline flow diagrams, install steps, quick start, core concepts, at least three end-to-end examples, API quick reference, multi-language Sidecar pointers, and links to design docs / openspec specs.

#### Scenario: Newcomer can find quick start
- **WHEN** a reader opens `README.md`
- **THEN** they can locate install commands and a minimal runnable Sequential workflow example within the first screenfuls of content

### Requirement: Full-pipeline flow diagrams
The README SHALL include a dedicated section that explains what Uni-Flow does and how a request flows end-to-end, using Mermaid (or equivalent) diagrams covering: (1) system panorama from caller/SDK/REST/MCP through ControlFlow, WorkflowUnit/RuntimeAdapter, MessageBus/SharedState, and Layer 4 services to final result/checkpoint/HITL; (2) the single-unit execution pipeline in the same order as the engine implementation (Policy → Security → Context → Execute → post-hooks → Record → Checkpoint → Observability → MessageBus). Each diagram MUST be followed by short stage annotations in Simplified Chinese.

#### Scenario: Reader sees both panorama and unit pipeline
- **WHEN** a reader opens the full-pipeline section of `README.md`
- **THEN** they can identify the system panorama diagram and the unit execution pipeline diagram without opening other docs

#### Scenario: Unit pipeline order matches engine
- **WHEN** a reader compares the unit pipeline diagram to the implemented execution order
- **THEN** the documented stages appear in the same sequence as PolicyEngine.preCheck → SecurityGovernance.preHook → ContextManager.assemble → RuntimeAdapter.execute → post-hooks → record → checkpoint → observability → MessageBus.publish

### Requirement: Examples match public TypeScript API
Code snippets in `README.md` and referenced example files MUST import only symbols exported from the package public entry (`src/index.ts` / published package root) and MUST compile against the current type definitions.

#### Scenario: Sequential example uses exported factories
- **WHEN** the quick-start Sequential example is written
- **THEN** it uses `createWorkflowEngine`, `createSharedState`, `SequentialFlow`, and `createMockAdapter` (or documented production adapters)

### Requirement: Complete case coverage
The README SHALL document three complete usage paths: (A) in-process Sequential pipeline, (B) Router (or mixed) workflow with pointer to `examples/code-review-workflow.ts`, (C) Orchestrator HTTP + `UniFlowClient` including listed REST routes.

#### Scenario: Orchestrator route table present
- **WHEN** a reader opens the Orchestrator case section
- **THEN** they see how to start a run via `POST /workflows/:id/runs` and how to query status via `GET /workflows/:id/runs/:runId`

### Requirement: Layer 4 and Sidecar overview
The README SHALL briefly describe ContextManager, CheckpointStore, PolicyEngine, and SecurityGovernance optional injection via `WorkflowEngineOptions`, and SHALL point to Python/Java SDK Sidecar directories for LangGraph/LangChain/LangChain4j.

#### Scenario: Sidecar section exists
- **WHEN** a Java/Python user wants zero-invasive integration
- **THEN** the README links to `sdk/python` and `sdk/java` with a short Sidecar usage note
