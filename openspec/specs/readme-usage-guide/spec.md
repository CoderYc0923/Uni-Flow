# readme-usage-guide

## Purpose

Root README portal: install/quick start, minimal examples, and links to the VitePress site for full tutorials, architecture, and API handbooks.

## Requirements

### Requirement: Root README exists with usage guide structure
The repository SHALL provide a root `README.md` written primarily in Simplified Chinese that acts as a **portal**: project one-liner and product Who/Why hook, install steps, a minimal runnable quick-start snippet, links to the **VitePress** documentation site for Why / architecture / full tutorials / API handbooks, pointers to examples and key repo paths, and license. Exhaustive tutorials, large Mermaid galleries, and full API guides MUST live primarily on the VitePress site (not duplicated in full inside README).

#### Scenario: Newcomer can find quick start
- **WHEN** a reader opens `README.md`
- **THEN** they can locate install commands and a minimal runnable example, and a clear link to the VitePress documentation site for deeper guides

#### Scenario: Full pipeline lives in docs site
- **WHEN** a reader needs architecture diagrams and API handbooks
- **THEN** README directs them to the VitePress site rather than embedding the full former long README or MkDocs-only paths as the sole source

### Requirement: README CTA targets VitePress Why and API
The README portal SHALL explicitly link to VitePress pages for product Why and API Reference (or the deployed Pages URL equivalent).

#### Scenario: Why and API links present
- **WHEN** a reader scans README documentation links
- **THEN** at least one link targets Why/3W content and at least one targets API reference on the VitePress site

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
