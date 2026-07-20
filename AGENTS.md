# AGENTS.md — Uni-Flow

Conventions for coding agents working in this repository.

**Human narrative (Who/Why/How, architecture, API handbooks):** VitePress site under `docs-web/` (`npm run docs:dev`). Do not treat retired MkDocs `docs-site/` as live docs. Keep this file as hard rules only.

## Orchestration (YAML-first)

1. Change workflow **topology** in Workflow YAML (`apiVersion: uniflow/v1`), not with a second hand-rolled scheduler.
2. Add new domain capability as a **`uses` plugin** and register it (`createEngineFromYaml` registry **or** Orchestrator `bindings`).
3. Do **not** replace ControlFlow/YAML with `for`/`while` multi-agent scheduling.
4. After editing YAML, run **`uniflow validate`**.

## `uses` decision (how to plug an Agent)

```text
Need Uni-Flow orchestration?
├─ Single TS project, in-process → createEngineFromYaml + registry[uses]
│    (full Engine is TypeScript-only today)
├─ Another TS project as Unit → HTTP `/execute` (Workflow-as-Unit)
│    + bindings / createWorkflowAsUnitHttpHandler
│    → docs-web/guide/cross-project.md · examples/workflow-as-unit/
└─ Checkpoint/Memory beside foreign graph → Sidecar SDK (does NOT replace YAML)
```

Python/Java SDKs talk to Orchestrator or expose Units; they are **not** a full in-process Engine yet.

## Cross-project (TS first)

| Item | Path |
|------|------|
| Design | `docs/superpowers/specs/2026-07-17-cross-project-unit-composability-design.md` |
| TS↔TS demo | `examples/workflow-as-unit/` |
| Multi-lang SDK demos (clients) | `examples/cross-lang/` |
| Remote Unit contract | `docs/remote-unit-http-contract.md`（includes optional `input.params`） |
| Wrapper helper | `runWorkflowAsUnit` / `createWorkflowAsUnitHttpHandler` |

**Business knobs across Units:** `AgentInput.params` (optional); do not put secrets in `params`.

**Registry memory:** Orchestrator registrations are in-process; restart ⇒ re-`from-yaml`.

**Run result fields:** `runId`, `status`, `result.completedUnits`, `result.state` (e.g. `output.<unitId>`).

## P3 `artifacts` (reserved)

`AgentOutput.metadata.artifacts` / SharedState key `artifacts` MAY hold `[{ id, uri?, mimeType?, label? }]`. Engine and SDKs **pass through only** — do not implement media pipelines or depend on engine processing.

## Key paths

| Artifact | Path |
|----------|------|
| JSON Schema | `schemas/uniflow.workflow.schema.json` |
| Loader | `src/yaml/` → `createEngineFromYaml` |
| CLI | `dist/cli/uniflow.js` |
| Templates | `examples/templates/` |
| Cursor rule | `.cursor/rules/uni-flow.mdc` |
| Docs site (VitePress) | `docs-web/` — Why: `docs-web/why/` · Architecture: `docs-web/architecture/` · API: `docs-web/reference/`（`npm run docs:dev` / `docs:build`） |
| Docs deploy | `.github/workflows/docs.yml` → GitHub Pages |
| Design appendix | `docs-web/architecture/design-longform.md` |

## Dual-track

- **YAML path**: default for new orchestration.
- **Code path**: `createWorkflowEngine` for tests and Composite edge cases; same Engine/Layer4.
